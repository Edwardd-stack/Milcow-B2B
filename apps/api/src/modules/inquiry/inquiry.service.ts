import { Injectable } from '@nestjs/common';
import type { InquiryInfo } from '@milcow/shared';
import { PrismaService } from '../../libs/prisma/prisma.service';
import type { CreateInquiryDto } from './dto/create-inquiry.dto';
import { toInquiryInfo } from './inquiry.mapper';

@Injectable()
export class InquiryService {
  constructor(private readonly prisma: PrismaService) {}

  /** Saves a contact-form message as NEW; staff answer it from the admin app */
  async create(input: CreateInquiryDto): Promise<InquiryInfo> {
    const inquiry = await this.prisma.inquiry.create({
      data: {
        inquiryName: input.inquiryName,
        inquiryEmail: input.inquiryEmail.toLowerCase(),
        inquiryCompany: input.inquiryCompany || null, // "" → null
        inquiryMessage: input.inquiryMessage,
      },
    });
    return toInquiryInfo(inquiry);
  }
}
