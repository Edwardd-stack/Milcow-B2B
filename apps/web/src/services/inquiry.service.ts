import type { CreateInquiryInput, InquiryInfo } from '@milcow/shared';
import { apiFetch } from '@/lib/api-client';

/** POST /inquiries — public contact form (works without login, rate-limited per IP) */
export const createInquiry = (input: CreateInquiryInput) =>
  apiFetch<InquiryInfo>('/inquiries', { method: 'POST', body: JSON.stringify(input) });
