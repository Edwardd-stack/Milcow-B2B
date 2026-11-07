export const InquiryStatus = {
  NEW: 'NEW',
  ANSWERED: 'ANSWERED',
} as const;
export type InquiryStatus = (typeof InquiryStatus)[keyof typeof InquiryStatus];
