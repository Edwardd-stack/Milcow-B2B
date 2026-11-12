import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import type { CreateInquiryInput } from '@milcow/shared';
import { INQUIRY_COMPANY_MAX, INQUIRY_MESSAGE_MAX, INQUIRY_NAME_MAX } from '../inquiry.constants';

/** Spaces around the text are removed before validation ("   " → "" → rejected) */
const trim = () =>
  Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value));

export class CreateInquiryDto implements CreateInquiryInput {
  /** @example "김민수" */
  @trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(INQUIRY_NAME_MAX)
  inquiryName: string;

  /** @example "buyer@bakery.co.kr" */
  @trim()
  @IsEmail()
  @MaxLength(100)
  inquiryEmail: string;

  /** @example "행복베이커리" */
  @trim()
  @IsOptional()
  @IsString()
  @MaxLength(INQUIRY_COMPANY_MAX)
  inquiryCompany?: string;

  /** @example "매달 5톤 원유를 계약하고 싶은데 단가 협의가 가능한가요?" */
  @trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(INQUIRY_MESSAGE_MAX)
  inquiryMessage: string;
}
