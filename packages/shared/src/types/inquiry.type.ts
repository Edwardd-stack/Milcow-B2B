import type { InquiryStatus } from '../enums';

/** POST /inquiries body — the public contact form (no account needed) */
export interface CreateInquiryInput {
  inquiryName: string;
  inquiryEmail: string;
  inquiryCompany?: string;
  inquiryMessage: string;
}

/** POST /inquiries response (later: the admin list) */
export interface InquiryInfo {
  id: string;
  inquiryName: string;
  inquiryEmail: string;
  inquiryCompany: string | null;
  inquiryMessage: string;
  inquiryStatus: InquiryStatus;
  createdAt: string; // ISO date
}
