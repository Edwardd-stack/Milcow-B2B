import type { Prisma, PrismaClient } from '../../generated/prisma/client';
import { DEMO_EMAIL_SUFFIX } from '@milcow/shared';

// Contact-form messages for the admin console (.test e-mails can never belong to a real person).
// Used by the seed and restored by the nightly demo reset.
export const INQUIRIES: Prisma.InquiryCreateManyInput[] = [
  {
    inquiryName: '박서연',
    inquiryEmail: 'cafe@example.test',
    inquiryCompany: '라떼하우스 (카페 체인 12개점)',
    inquiryMessage:
      '매장용 원유를 매주 소량(0.5톤)으로 받을 수 있을까요? 최소 주문량이 궁금합니다.',
  },
  {
    inquiryName: 'Daniel Lee',
    inquiryEmail: 'daniel@example.test',
    inquiryCompany: 'Busan Food Factory',
    inquiryMessage:
      'We need 30 t of milk powder per month for 12 months. Is a volume discount possible?',
    inquiryStatus: 'ANSWERED',
  },
  {
    inquiryName: 'Malika Yusupova',
    inquiryEmail: 'malika@example.test',
    inquiryMessage: 'Gimhae omboridan shanba kuni ham olib ketish mumkinmi?',
  },
];

/** Puts the demo messages back as they were (real visitors' messages are not touched) */
export async function resetDemoInquiries(prisma: PrismaClient | Prisma.TransactionClient) {
  await prisma.inquiry.deleteMany({ where: { inquiryEmail: { endsWith: DEMO_EMAIL_SUFFIX } } });
  const now = Date.now();
  await prisma.inquiry.createMany({
    // Spread over the last days so the inbox looks lived-in
    data: INQUIRIES.map((inquiry, i) => ({
      ...inquiry,
      createdAt: new Date(now - (i + 1) * 7 * 3_600_000),
      ...(inquiry.inquiryStatus === 'ANSWERED' && {
        inquiryAnsweredAt: new Date(now - (i + 1) * 5 * 3_600_000),
      }),
    })),
  });
  return INQUIRIES.length;
}
