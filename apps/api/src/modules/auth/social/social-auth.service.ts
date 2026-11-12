import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';
import type { SocialPendingInfo, SocialProvider } from '@milcow/shared';
import type { Member } from '../../../generated/prisma/client';
import { MemberService } from '../../member/member.service';
import { AuthService, type AuthResult } from '../auth.service';
import { GoogleProvider } from './providers/google.provider';
import { KakaoProvider } from './providers/kakao.provider';
import type { SocialCompleteDto } from './dto/social-complete.dto';
import type {
  OAuthState,
  PendingSocialSignup,
  SocialAuthProvider,
  SocialProfile,
} from './social.types';

export const OAUTH_STATE_COOKIE = 'milcow_oauth';
export const SOCIAL_PENDING_COOKIE = 'milcow_social';
export const OAUTH_STATE_TTL_SEC = 10 * 60; // the user has 10 min at Kakao / Google
export const SOCIAL_PENDING_TTL_SEC = 30 * 60; // ...and 30 min to fill in the company form

/** Result of a callback: either logged in, or a new user who still needs the company form */
export type SocialLoginResult =
  | { kind: 'loggedIn'; auth: AuthResult; next: string }
  | { kind: 'pending'; pending: PendingSocialSignup };

/**
 * Kakao / Google login (OAuth 2.0 Authorization Code flow):
 * start → provider login page → callback with ?code → profile → our member → httpOnly cookie.
 */
@Injectable()
export class SocialAuthService {
  private readonly providers: Record<SocialProvider, SocialAuthProvider>;

  constructor(
    kakao: KakaoProvider,
    google: GoogleProvider,
    private readonly members: MemberService,
    private readonly auth: AuthService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    this.providers = { kakao, google };
  }

  /** Must match the Redirect URI registered at Kakao / Google — goes through the web proxy (3001) */
  redirectUri(provider: SocialProvider) {
    return `${this.webOrigin()}/api/v1/auth/${provider}/callback`;
  }

  webOrigin() {
    return this.config.getOrThrow<string>('WEB_ORIGIN').replace(/\/$/, '');
  }

  /** Step 1: random `state` (kept in a signed cookie) + the provider's login URL */
  async start(provider: SocialProvider, next: string) {
    const adapter = this.adapter(provider);
    const state = randomBytes(16).toString('base64url');
    const stateToken = await this.sign<OAuthState>({ state, provider, next }, OAUTH_STATE_TTL_SEC);
    return { stateToken, url: adapter.authorizeUrl(state, this.redirectUri(provider)) };
  }

  /** Step 2: check `state`, read the profile, find / link the member */
  async callback(
    provider: SocialProvider,
    code: string,
    state: string,
    stateToken: string | undefined,
  ): Promise<SocialLoginResult> {
    const saved = stateToken ? await this.verify<OAuthState>(stateToken) : null;
    // Different state → this callback was not started by this browser (CSRF) → reject
    if (!saved || saved.state !== state || saved.provider !== provider) {
      throw new BadRequestException('Invalid OAuth state');
    }

    const profile = await this.adapter(provider).fetchProfile(code, this.redirectUri(provider));
    const member = await this.findMember(profile);
    if (member) return { kind: 'loggedIn', auth: await this.loginAs(member), next: saved.next };

    const { emailVerified, ...rest } = profile;
    // An unverified email is not trusted — the user types it again in the company form
    return {
      kind: 'pending',
      pending: { ...rest, email: emailVerified ? rest.email : null, next: saved.next },
    };
  }

  pendingToken(pending: PendingSocialSignup) {
    return this.sign(pending, SOCIAL_PENDING_TTL_SEC);
  }

  /** For the company form: what we already know (null = nothing pending / expired) */
  async readPending(token: string | undefined): Promise<SocialPendingInfo | null> {
    const pending = token ? await this.verify<PendingSocialSignup>(token) : null;
    return pending
      ? { provider: pending.provider, email: pending.email, nick: pending.nick }
      : null;
  }

  /** Step 3 (new users only): company form → create the member → logged in */
  async complete(token: string | undefined, input: SocialCompleteDto) {
    const pending = token ? await this.verify<PendingSocialSignup>(token) : null;
    if (!pending) throw new UnauthorizedException('Social login expired — please start again');

    const email = pending.email ?? input.memberEmail;
    if (!email) throw new BadRequestException('memberEmail is required');
    if (await this.members.findByEmail(email)) {
      throw new ConflictException('This email is already registered');
    }

    const member = await this.members.createSocialBuyer({
      provider: pending.provider,
      providerId: pending.providerId,
      memberEmail: email,
      memberNick: input.memberNick,
      memberCompanyName: input.memberCompanyName,
      memberBizNo: input.memberBizNo,
      memberPhone: input.memberPhone,
      memberLang: input.memberLang,
    });
    return { auth: await this.auth.buildAuthResponse(member), next: pending.next };
  }

  /** Known social id → that member. Else a VERIFIED email of an existing account → link it. */
  private async findMember(profile: SocialProfile): Promise<Member | null> {
    const byId = await this.members.findBySocialId(profile.provider, profile.providerId);
    if (byId) return byId;

    if (profile.email && profile.emailVerified) {
      const byEmail = await this.members.findByEmail(profile.email);
      if (byEmail)
        return this.members.linkSocialId(byEmail.id, profile.provider, profile.providerId);
    }
    return null;
  }

  private async loginAs(member: Member) {
    if (member.memberStatus !== 'ACTIVE')
      throw new ForbiddenException('This account is not active');
    return this.auth.buildAuthResponse(member);
  }

  private adapter(provider: SocialProvider) {
    const adapter = this.providers[provider];
    if (!adapter.isConfigured()) {
      throw new ServiceUnavailableException(`${provider} login is not configured`);
    }
    return adapter;
  }

  /**
   * Short-lived helper tokens use their OWN secret,
   * so they can never be used as a login token (and a login token can't be used here).
   */
  private secret() {
    return `${this.config.getOrThrow<string>('JWT_SECRET')}:social`;
  }

  private sign<T extends object>(payload: T, expiresIn: number) {
    return this.jwt.signAsync(payload, { secret: this.secret(), expiresIn });
  }

  private async verify<T extends object>(token: string): Promise<T | null> {
    return this.jwt.verifyAsync<T>(token, { secret: this.secret() }).catch(() => null);
  }
}
