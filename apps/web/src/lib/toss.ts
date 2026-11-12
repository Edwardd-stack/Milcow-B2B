/**
 * Toss Payments SDK v2, loaded from Toss's CDN on first use (no npm package, nothing on other pages).
 * Docs: https://docs.tosspayments.com/sdk/v2/js
 */
interface TossPaymentRequest {
  method: 'CARD';
  amount: { currency: 'KRW'; value: number };
  orderId: string;
  orderName: string;
  successUrl: string;
  failUrl: string;
  customerEmail?: string;
  customerName?: string;
}

interface TossPaymentsInstance {
  payment(options: { customerKey: string }): {
    requestPayment(request: TossPaymentRequest): Promise<void>;
  };
}

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => TossPaymentsInstance;
  }
}

const SDK_URL = 'https://js.tosspayments.com/v2/standard';

/** Public client key (test_ck_… / live_ck_…). The secret key lives only in the API's .env */
export const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

let loading: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  if (window.TossPayments) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SDK_URL;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null; // allow a retry
      reject(new Error('Toss SDK failed to load'));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/** Opens the Toss card payment window. Resolves by leaving the page (redirect to successUrl / failUrl). */
export async function requestTossPayment(
  customerKey: string,
  request: Omit<TossPaymentRequest, 'method'>,
) {
  if (!TOSS_CLIENT_KEY) throw new Error('NEXT_PUBLIC_TOSS_CLIENT_KEY is not set');
  await loadSdk();
  const toss = window.TossPayments!(TOSS_CLIENT_KEY);
  await toss.payment({ customerKey }).requestPayment({ method: 'CARD', ...request });
}
