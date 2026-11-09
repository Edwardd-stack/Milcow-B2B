import { Injectable } from '@nestjs/common';
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
}
