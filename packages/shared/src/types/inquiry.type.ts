import type { InquiryStatus } from '../enums';

/** POST /inquiries body — the public contact form (no account needed) */
export interface CreateInquiryInput {
  inquiryName: string;
  inquiryEmail: string;
  inquiryCompany?: string;
  inquiryMessage: string;
}

/** POST /inquiries response, GET /inquiries (admin) */
export interface InquiryInfo {
  id: string;
  inquiryName: string;
  inquiryEmail: string;
  inquiryCompany: string | null;
  inquiryMessage: string;
  inquiryStatus: InquiryStatus;
  inquiryAnsweredAt: string | null;
  inquiryAnsweredBy: string | null; // staff nick
  createdAt: string; // ISO date
}
