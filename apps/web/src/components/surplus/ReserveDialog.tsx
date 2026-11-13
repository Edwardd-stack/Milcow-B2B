'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { SURPLUS_HOLD_MINUTES, type Locale, type OrderInfo, type SurplusLot } from '@milcow/shared';
import { useMe } from '@/hooks/useAuth';
import { useReserveSurplus } from '@/hooks/useLots';
import { usePayOrder } from '@/hooks/useOrders';
import { Link, useRouter } from '@/i18n/navigation';
import { ApiRequestError } from '@/lib/api-client';
import { formatKrw, formatTon } from '@/lib/format';
import { TOSS_CLIENT_KEY } from '@/lib/toss';

const MIN_TON = 1;

/** Reserve tons of a surplus lot → price held for 30 minutes → pay (Toss) */
export function ReserveDialog({ lot, onClose }: { lot: SurplusLot; onClose: () => void }) {
  const t = useTranslations('Surplus.dialog');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { data: member } = useMe();
  const reserve = useReserveSurplus();
  const pay = usePayOrder();
  const [ton, setTon] = useState(Math.min(lot.lotRemainingTon, Math.max(MIN_TON, 3)));
  const [order, setOrder] = useState<OrderInfo | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const max = lot.lotRemainingTon;
  const valid = ton >= MIN_TON && ton <= max;
  const total = Math.round(lot.pricePerTon * ton);

  const submit = () => {
    if (!member) {
      router.push(`/login?next=${encodeURIComponent('/surplus')}`);
      return;
    }
    reserve.mutate({ lotId: lot.id, ton }, { onSuccess: setOrder });
  };

  const error = reserve.isError
    ? reserve.error instanceof ApiRequestError && reserve.error.status === 409
      ? t('conflict')
      : reserve.error instanceof ApiRequestError && reserve.error.status === 403
        ? t('buyerOnly')
        : t('error')
    : pay.isError
      ? t('payError')
      : null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-navy/50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('title')}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-7"
      >
        {order ? (
          <>
            <p className="text-xl font-extrabold text-heading">✓ {t('reserved')}</p>
            <p className="mt-2 text-sm text-muted">
              {t('reservedText', { minutes: SURPLUS_HOLD_MINUTES })}
            </p>
            <p className="mt-4 rounded-2xl bg-cream px-4 py-3 text-sm">
              {formatTon(ton)} t · <b>{formatKrw(order.orderTotal, locale)}</b>
            </p>
            <div className="mt-5 flex gap-2">
              <Link
                href="/orders"
                className="flex-1 rounded-full border border-line py-3 text-center text-sm font-semibold text-muted"
              >
                {t('toOrders')}
              </Link>
              <button
                type="button"
                disabled={!TOSS_CLIENT_KEY || !member || pay.isPending}
                onClick={() =>
                  member && pay.mutate({ orderId: order.id, memberId: member.id, locale })
                }
                className="flex-1 rounded-full bg-brand py-3 text-sm font-semibold text-white hover:bg-navy disabled:opacity-50"
              >
                {pay.isPending ? t('paying') : t('payNow')}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xl font-extrabold text-heading">{t('title')}</p>
            <p className="mt-1 font-mono text-xs text-muted">{lot.lotCode}</p>
            <label className="mt-5 block">
              <span className="mb-2 block text-[13px] font-semibold text-heading">
                {t('ton', { min: MIN_TON, max: formatTon(max) })}
              </span>
              <input
                type="number"
                min={MIN_TON}
                max={max}
                step={0.5}
                value={ton}
                onChange={(e) => setTon(Number(e.target.value))}
                className="h-[50px] w-full rounded-2xl border border-line px-4 text-[15px] outline-none focus:border-brand focus:ring-4 focus:ring-brand/12"
              />
            </label>
            <dl className="mt-4 space-y-1.5 rounded-2xl bg-cream px-4 py-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">{t('price')}</dt>
                <dd className="font-semibold">{formatKrw(lot.pricePerTon, locale)} / t</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{t('total')}</dt>
                <dd className="text-lg font-extrabold text-heading">
                  {valid ? formatKrw(total, locale) : '—'}
                </dd>
              </div>
              <p className="text-xs text-soft">
                {t('holdNote', { minutes: SURPLUS_HOLD_MINUTES })}
              </p>
            </dl>
            {error && (
              <p className="mt-3 rounded-xl bg-[#fdecea] px-4 py-2.5 text-sm text-[#b42318]">
                {error}
              </p>
            )}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border border-line py-3 text-sm font-semibold text-muted"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                disabled={!valid || reserve.isPending}
                onClick={submit}
                className="flex-1 rounded-full bg-brand py-3 text-sm font-semibold text-white hover:bg-navy disabled:opacity-50"
              >
                {reserve.isPending ? t('reserving') : member ? t('confirm') : t('loginFirst')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
