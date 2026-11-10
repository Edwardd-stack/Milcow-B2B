import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { MemberInfo } from '@milcow/shared';
import type { Member } from '../../generated/prisma/client';
import type { JwtPayload } from '../../libs/types/auth.type';
import { hashPassword, verifyPassword } from '../../libs/utils/password.util';
import { toMemberInfo } from '../member/member.mapper';
import { MemberService } from '../member/member.service';
import type { LoginDto } from './dto/login.dto';
import type { SignupDto } from './dto/signup.dto';

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

  private async buildAuthResponse(member: Member): Promise<AuthResult> {
    const payload: JwtPayload = {
      sub: member.id,
      memberType: member.memberType,
      warehouseId: member.warehouseId,
    };
    return {
      accessToken: await this.jwt.signAsync(payload),
      member: toMemberInfo(member),
    };
  }
}
