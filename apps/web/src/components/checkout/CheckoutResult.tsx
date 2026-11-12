'use client';

import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { Link } from '@/i18n/navigation';
import { ApiRequestError } from '@/lib/api-client';
import { formatKrw } from '@/lib/format';
import { cancelOrder, confirmPayment, failPayment } from '@/services/order.service';

const card =
  'relative -mt-16 mx-auto mb-24 max-w-[620px] rounded-3xl bg-white px-6 py-12 text-center shadow-[0_20px_50px_rgba(17,55,95,0.1)] sm:px-10';
const primary =
  'rounded-full bg-brand px-8 py-3.5 font-semibold text-white transition hover:bg-navy';
const ghost =
  'rounded-full border border-brand px-8 py-3.5 font-semibold text-brand transition hover:bg-brand hover:text-white';

const Badge = ({ ok }: { ok: boolean }) => (
  <span
    className={`mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full ${ok ? 'bg-[#e7f6ec] text-[#2f8f4e]' : 'bg-[#fdecea] text-[#b42318]'}`}
  >
    <svg
      viewBox="0 0 24 24"
      className="h-10 w-10"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ok ? 'm5 12 5 5 9-10' : 'M6 6l12 12M18 6 6 18'} />
    </svg>
  </span>
);

/**
 * Toss's successUrl: ?paymentKey=…&orderId=…&amount=… → the SERVER confirms with Toss.
 * useQuery (not an effect): the confirm request runs once even in React's dev double-render.
 */
export function CheckoutSuccess() {
  const t = useTranslations('Checkout');
  const locale = useLocale();
  const params = useSearchParams();
  const paymentKey = params.get('paymentKey') ?? '';
  const tossOrderId = params.get('orderId') ?? '';
  const amount = Number(params.get('amount'));

  const {
    data: payment,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['payment-confirm', tossOrderId],
    queryFn: async () => {
      try {
        return await confirmPayment({ paymentKey, tossOrderId, amount });
      } catch (error) {
        // 409 = already confirmed (the buyer refreshed this page) → still a success, just no details
        if (error instanceof ApiRequestError && error.status === 409) return null;
        throw error;
      }
    },
    enabled: !!paymentKey && !!tossOrderId && amount > 0,
    retry: false,
    staleTime: Infinity,
  });
  const failed =
    isError || !paymentKey || !tossOrderId || (payment && payment.paymentStatus !== 'DONE');

  return (
    <>
      <PageHero title={t('success.title')} current={t('success.title')} />
      <Container>
        <div className={card}>
          {failed ? (
            <>
              <Badge ok={false} />
              <h2 className="text-2xl font-extrabold text-heading">{t('success.failed')}</h2>
              <p className="mt-2 text-muted">{t('success.failedText')}</p>
              <div className="mt-8">
                <Link href="/products" className={primary}>
                  {t('fail.retry')}
                </Link>
              </div>
            </>
          ) : isPending ? (
            <>
              <span className="mx-auto mb-6 block h-14 w-14 animate-spin rounded-full border-4 border-line border-t-brand" />
              <p className="text-muted">{t('success.checking')}</p>
            </>
          ) : (
            <>
              <Badge ok />
              <h2 className="text-2xl font-extrabold text-heading">{t('success.heading')}</h2>
              <p className="mt-2 text-muted">{t('success.text')}</p>
              {payment && (
                <dl className="mx-auto mt-7 max-w-sm space-y-2.5 rounded-2xl bg-cream px-5 py-4 text-left text-sm">
                  {[
                    [t('success.amount'), formatKrw(payment.paymentAmount, locale)],
                    [t('success.method'), payment.paymentMethod ?? '—'],
                    [t('success.orderNo'), payment.paymentTossOrderId],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <dt className="text-muted">{label}</dt>
                      <dd className="truncate font-semibold text-heading">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/products" className={primary}>
                  {t('success.more')}
                </Link>
                <Link href="/orders" className={ghost}>
                  {t('success.orders')}
                </Link>
              </div>
            </>
          )}
        </div>
      </Container>
    </>
  );
}

/** Toss's failUrl: ?code=…&message=…&orderId=… → mark the payment failed and free the reserved stock */
export function CheckoutFail() {
  const t = useTranslations('Checkout');
  const params = useSearchParams();
  const tossOrderId = params.get('orderId') ?? '';
  const code = params.get('code') ?? undefined;
  const message = params.get('message') ?? undefined;

  useQuery({
    queryKey: ['payment-fail', tossOrderId],
    queryFn: async () => {
      const payment = await failPayment({ tossOrderId, code, message });
      await cancelOrder(payment.orderId).catch(() => undefined);
      return payment;
    },
    enabled: !!tossOrderId,
    retry: false,
    staleTime: Infinity,
  });

  return (
    <>
      <PageHero title={t('fail.title')} current={t('fail.title')} />
      <Container>
        <div className={card}>
          <Badge ok={false} />
          <h2 className="text-2xl font-extrabold text-heading">{t('fail.heading')}</h2>
          <p className="mt-2 text-muted">{t('fail.text')}</p>
          {message && (
            <p className="mx-auto mt-5 max-w-sm rounded-2xl bg-cream px-5 py-3 text-sm text-muted">
              {t('fail.reason')}: {message}
            </p>
          )}
          <div className="mt-8">
            <Link href="/products" className={primary}>
              {t('fail.retry')}
            </Link>
          </div>
        </div>
      </Container>
    </>
  );
}
