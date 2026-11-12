import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const TOSS_API = 'https://api.tosspayments.com/v1';

/** Part of the Toss payment object we use (full object: docs.tosspayments.com) */
export interface TossPayment {
  paymentKey: string;
  orderId: string;
  status: string; // "DONE" when approved
  method: string | null; // "카드", "계좌이체", ...
  totalAmount: number;
  approvedAt: string | null;
}

/** Error returned by Toss, e.g. { code: "REJECT_CARD_PAYMENT", message: "..." } */
export class TossPaymentsError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'TossPaymentsError';
  }
}

/** Thin HTTP client for the Toss Payments REST API. */
@Injectable()
export class TossPaymentsClient {
  private readonly authHeader: string;

  constructor(config: ConfigService) {
    // Basic auth: base64("<secretKey>:") — the colon and empty password are required
    const secretKey = config.getOrThrow<string>('TOSS_SECRET_KEY');
    this.authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;
  }

  /** Final step: Toss charges the card only after this call succeeds. */
  async confirm(paymentKey: string, orderId: string, amount: number): Promise<TossPayment> {
    const response = await fetch(`${TOSS_API}/payments/confirm`, {
      method: 'POST',
      headers: { Authorization: this.authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount }),
      signal: AbortSignal.timeout(30_000),
    });
    const body = (await response.json()) as TossPayment | { code: string; message: string };

    if (!response.ok || !('paymentKey' in body)) {
      const error = body as { code?: string; message?: string };
      throw new TossPaymentsError(error.code ?? 'UNKNOWN', error.message ?? 'Toss payment failed');
    }
    return body;
  }
}
