import { Injectable } from '@nestjs/common';
import type { Lang, SocialProvider } from '@milcow/shared';
import { PrismaService } from '../../libs/prisma/prisma.service';
import type { SignupDto } from '../auth/dto/signup.dto';

@Injectable()
export class MemberService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.member.findUnique({ where: { memberEmail: email.toLowerCase() } });
  }

  findById(id: string) {
    return this.prisma.member.findUnique({ where: { id } });
  }

  /** Public signup always creates a BUYER — staff and admins are created by an admin. */
  createBuyer(input: SignupDto, passwordHash: string) {
    return this.prisma.member.create({
      data: {
        memberType: 'BUYER',
        memberEmail: input.memberEmail.toLowerCase(),
        memberPassword: passwordHash,
        memberNick: input.memberNick,
        memberCompanyName: input.memberCompanyName,
        memberBizNo: input.memberBizNo,
        memberPhone: input.memberPhone,
        memberLang: input.memberLang,
      },
    });
  }

  /** Social login: Kakao / Google user id → our member */
  findBySocialId(provider: SocialProvider, providerId: string) {
    return this.prisma.member.findUnique({ where: socialIdWhere(provider, providerId) });
  }

  /** An existing account (same verified email) gets the social id → next time it logs in directly */
  linkSocialId(memberId: string, provider: SocialProvider, providerId: string) {
    return this.prisma.member.update({
      where: { id: memberId },
      data: provider === 'kakao' ? { memberKakaoId: providerId } : { memberGoogleId: providerId },
    });
  }

  /** First social login after the company form — a BUYER without a password */
  createSocialBuyer(input: SocialBuyerInput) {
    return this.prisma.member.create({
      data: {
        memberType: 'BUYER',
        memberEmail: input.memberEmail.toLowerCase(),
        memberPassword: null,
        ...(input.provider === 'kakao'
          ? { memberKakaoId: input.providerId }
          : { memberGoogleId: input.providerId }),
        memberNick: input.memberNick,
        memberCompanyName: input.memberCompanyName,
        memberBizNo: input.memberBizNo,
        memberPhone: input.memberPhone,
        memberLang: input.memberLang,
      },
    });
  }
}

function socialIdWhere(provider: SocialProvider, providerId: string) {
  return provider === 'kakao' ? { memberKakaoId: providerId } : { memberGoogleId: providerId };
}

export interface SocialBuyerInput {
  provider: SocialProvider;
  providerId: string;
  memberEmail: string;
  memberNick: string;
  memberCompanyName: string;
  memberBizNo?: string;
  memberPhone?: string;
  memberLang?: Lang;
}
