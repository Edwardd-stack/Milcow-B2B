import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SocialAuthProvider, SocialProfile } from '../social.types';
import { getWithToken, postForm } from './oauth-http';

interface KakaoToken {
  access_token: string;
}

interface KakaoUser {
  id: number;
  kakao_account?: {
    email?: string;
    is_email_verified?: boolean;
    is_email_valid?: boolean;
    profile?: { nickname?: string };
  };
}

/** Kakao Login (REST API) — https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api */
@Injectable()
export class KakaoProvider implements SocialAuthProvider {
  readonly name = 'kakao' as const;

  constructor(private readonly config: ConfigService) {}

  private get clientId() {
    return this.config.get<string>('KAKAO_REST_API_KEY');
  }

  isConfigured() {
    return !!this.clientId;
  }

  authorizeUrl(state: string, redirectUri: string) {
    const query = new URLSearchParams({
      client_id: this.clientId ?? '',
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
    });
    return `https://kauth.kakao.com/oauth/authorize?${query.toString()}`;
  }

  async fetchProfile(code: string, redirectUri: string): Promise<SocialProfile> {
    const token = await postForm<KakaoToken>('https://kauth.kakao.com/oauth/token', {
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.config.get<string>('KAKAO_CLIENT_SECRET') || undefined,
      redirect_uri: redirectUri,
      code,
    });
    const user = await getWithToken<KakaoUser>(
      'https://kapi.kakao.com/v2/user/me',
      token.access_token,
    );
    const account = user.kakao_account;

    return {
      provider: 'kakao',
      providerId: String(user.id),
      email: account?.email ?? null,
      // Kakao: "verified" = the user confirmed it, "valid" = it still works
      emailVerified: !!(account?.is_email_verified && account?.is_email_valid),
      nick: account?.profile?.nickname ?? 'Kakao user',
    };
  }
}
