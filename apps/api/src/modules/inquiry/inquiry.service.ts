import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { isDemoEmail, type InquiryInfo, type Paginated } from '@milcow/shared';
import { assertDemoCanModify } from '../../common/policies/demo.policy';
import { PrismaService } from '../../libs/prisma/prisma.service';
import type { AuthMember } from '../../libs/types/auth.type';
import { toPaginated, toSkipTake } from '../../libs/utils/pagination.util';
import { RealtimeService } from '../realtime/realtime.service';
import type { CreateInquiryDto } from './dto/create-inquiry.dto';
import type { InquiryListQueryDto } from './dto/inquiry-list-query.dto';
import { inquiryInclude, toInquiryInfo } from './inquiry.mapper';

@Injectable()
export class InquiryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  /** Saves a contact-form message as NEW; staff answer it from the admin console */
  async create(input: CreateInquiryDto): Promise<InquiryInfo> {
    const inquiry = await this.prisma.inquiry.create({
      data: {
        inquiryName: input.inquiryName,
        inquiryEmail: input.inquiryEmail.toLowerCase(),
        inquiryCompany: input.inquiryCompany || null, // "" → null
        inquiryMessage: input.inquiryMessage,
      },
      include: inquiryInclude,
    });
    this.realtime.inquiryCreated({
      inquiryId: inquiry.id,
      inquiryName: inquiry.inquiryName,
      createdAt: inquiry.createdAt.toISOString(),
    });
    return toInquiryInfo(inquiry);
  }

  /** Admin inbox, newest first */
  async findAll(member: AuthMember, query: InquiryListQueryDto): Promise<Paginated<InquiryInfo>> {
    const where = query.inquiryStatus ? { inquiryStatus: query.inquiryStatus } : {};
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.inquiry.findMany({
        where,
        include: inquiryInclude,
        orderBy: { createdAt: 'desc' },
        ...toSkipTake(query.page, query.limit),
      }),
      this.prisma.inquiry.count({ where }),
    ]);
    return toPaginated(
      rows.map((row) => toInquiryInfo(row, member)),
      total,
      query.page,
      query.limit,
    );
  }

  /** The reply goes out by e-mail; here staff only record that it was answered */
  async markAnswered(member: AuthMember, id: string): Promise<InquiryInfo> {
    const current = await this.prisma.inquiry.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Inquiry not found');
    assertDemoCanModify(member, isDemoEmail(current.inquiryEmail));
    if (current.inquiryStatus === 'ANSWERED') throw new ConflictException('Already answered');

    const inquiry = await this.prisma.inquiry.update({
      where: { id },
      data: {
        inquiryStatus: 'ANSWERED',
        inquiryAnsweredAt: new Date(),
        inquiryAnsweredById: member.id,
      },
      include: inquiryInclude,
    });
    return toInquiryInfo(inquiry, member);
  }
}
