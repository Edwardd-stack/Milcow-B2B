import { isDemoEmail, type InquiryInfo } from '@milcow/shared';
import type { Prisma } from '../../generated/prisma/client';
import { contactFor } from '../../common/policies/demo.policy';
import type { AuthMember } from '../../libs/types/auth.type';

export const inquiryInclude = {
  inquiryAnsweredBy: { select: { memberNick: true } },
} satisfies Prisma.InquiryInclude;

type InquiryRow = Prisma.InquiryGetPayload<{ include: typeof inquiryInclude }>;

/** viewer given → e-mail masked for demo sessions (seed messages use .test addresses) */
export function toInquiryInfo(inquiry: InquiryRow, viewer?: AuthMember): InquiryInfo {
  const email = viewer
    ? contactFor(
        viewer,
        { email: inquiry.inquiryEmail, phone: null },
        isDemoEmail(inquiry.inquiryEmail),
      ).email
    : inquiry.inquiryEmail;
  return {
    id: inquiry.id,
    inquiryName: inquiry.inquiryName,
    inquiryEmail: email,
    inquiryCompany: inquiry.inquiryCompany,
    inquiryMessage: inquiry.inquiryMessage,
    inquiryStatus: inquiry.inquiryStatus,
    inquiryAnsweredAt: inquiry.inquiryAnsweredAt?.toISOString() ?? null,
    inquiryAnsweredBy: inquiry.inquiryAnsweredBy?.memberNick ?? null,
    createdAt: inquiry.createdAt.toISOString(),
  };
}
