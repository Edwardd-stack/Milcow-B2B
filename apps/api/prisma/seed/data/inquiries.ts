import type { Prisma } from '../../../src/generated/prisma/client';

// Contact-form messages for the admin app (.test emails can never belong to a real person)
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
