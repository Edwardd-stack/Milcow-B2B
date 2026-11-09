import type { PaymentStatus } from '../enums';

/** POST /payments/prepare — everything the Toss payment window needs */
export interface PaymentPrepareResponse {
  paymentId: string;
  tossOrderId: string; // pass to Toss as `orderId`
  amount: number; // KRW — the server decides the amount, not the browser
  orderName: string; // shown in the Toss window, e.g. "원유 (1등급) 20t"
  customerEmail: string;
  customerName: string;
}

/** POST /payments/confirm */
export interface PaymentInfo {
  id: string;
  orderId: string;
  paymentTossOrderId: string;
  paymentStatus: PaymentStatus;
  paymentMethod: string | null; // e.g. "카드"
  paymentAmount: number;
  paymentApprovedAt: string | null;
  paymentFailReason: string | null;
}
