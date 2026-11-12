import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { MemberInfo } from '@milcow/shared';
import type { Member } from '../../generated/prisma/client';
import type { AuthMember, JwtPayload } from '../../libs/types/auth.type';
import { hashPassword, verifyPassword } from '../../libs/utils/password.util';
import { toMemberInfo } from '../member/member.mapper';
import { MemberService } from '../member/member.service';
import type { LoginDto } from './dto/login.dto';
import type { SignupDto } from './dto/signup.dto';

/** Socket handshake token lifetime — only needs to survive the connect */
const SOCKET_TOKEN_TTL_SEC = 60;

/** Service → controller only. The controller puts the token into a cookie and returns just the member. */
export interface AuthResult {
  accessToken: string;
  member: MemberInfo;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly members: MemberService,
    private readonly jwt: JwtService,
  ) {}

  async signup(input: SignupDto): Promise<AuthResult> {
    const existing = await this.members.findByEmail(input.memberEmail);
    if (existing) throw new ConflictException('This email is already registered');

    const member = await this.members.createBuyer(input, await hashPassword(input.memberPassword));
    return this.buildAuthResponse(member);
  }

  async login(input: LoginDto): Promise<AuthResult> {
    const member = await this.members.findByEmail(input.memberEmail);
    const isValid = member?.memberPassword
      ? await verifyPassword(input.memberPassword, member.memberPassword)
      : false;

    // Same message for "no such email" and "wrong password" — don't reveal which emails exist
    if (!member || !isValid) throw new UnauthorizedException('Invalid email or password');
    if (member.memberStatus !== 'ACTIVE')
      throw new ForbiddenException('This account is not active');

    return this.buildAuthResponse(member);
  }

  async me(memberId: string): Promise<MemberInfo> {
    const member = await this.members.findById(memberId);
    if (!member || member.memberStatus !== 'ACTIVE') throw new UnauthorizedException();
    return toMemberInfo(member);
  }

  /** Signs the JWT for a member (also used by social login) */
  async buildAuthResponse(member: Member): Promise<AuthResult> {
    const payload: JwtPayload = {
      sub: member.id,
      memberType: member.memberType,
      warehouseId: member.warehouseId,
      demo: member.memberIsDemo,
    };
    return {
      accessToken: await this.jwt.signAsync(payload),
      member: toMemberInfo(member),
    };
  }

  /**
   * 60-second token used only for the socket handshake.
   * In production the web app (Vercel) proxies REST calls, but WebSockets can't go through
   * that proxy — the browser connects straight to the API host, where the httpOnly cookie
   * isn't sent. So the page asks for this token over REST first and passes it to socket.io.
   */
  socketToken(member: AuthMember): Promise<string> {
    const payload: JwtPayload = {
      sub: member.id,
      memberType: member.memberType,
      warehouseId: member.warehouseId,
      demo: member.isDemo,
      scope: 'socket',
    };
    return this.jwt.signAsync(payload, { expiresIn: SOCKET_TOKEN_TTL_SEC });
  }
}
