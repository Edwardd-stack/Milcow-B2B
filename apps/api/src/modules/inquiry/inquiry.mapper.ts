import type { InquiryInfo } from '@milcow/shared';
import type { Inquiry } from '../../generated/prisma/client';

export function toInquiryInfo(inquiry: Inquiry): InquiryInfo {
  return {
    id: inquiry.id,
    inquiryName: inquiry.inquiryName,
    inquiryEmail: inquiry.inquiryEmail,
    inquiryCompany: inquiry.inquiryCompany,
    inquiryMessage: inquiry.inquiryMessage,
    inquiryStatus: inquiry.inquiryStatus,
    createdAt: inquiry.createdAt.toISOString(),
  };
}
