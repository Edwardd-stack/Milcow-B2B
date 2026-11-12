'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale, OrderInfo } from '@milcow/shared';
import { useNow } from '@/hooks/useNow';
import { useCancelOrder, usePayOrder } from '@/hooks/useOrders';
import { Link } from '@/i18n/navigation';
import { truckForOrder } from '@/lib/fleet/fleet-sim';
import { formatKrw, formatTon } from '@/lib/format';
import { TOSS_CLIENT_KEY } from '@/lib/toss';
import { OrderStatusBadge, PickupStatusBadge } from './StatusBadge';

/** Short, readable order number: the last 8 characters of the UUID */
const orderNo = (id: string) => id.slice(-8).toUpperCase();

/** One order: a compact summary row that opens into the details + actions */
export function OrderRow({
  order,
  memberId,
  isDemo = false,
}: {
  order: OrderInfo;
  memberId: string;
  isDemo?: boolean;
}) {
  const t = useTranslations('Orders');
  const tp = useTranslations('Product');
  const locale = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  const cancel = useCancelOrder();
  const pay = usePayOrder();

  const [first, ...rest] = order.items;
  const title = first
    ? rest.length > 0
      ? t('andMore', { name: first.productName[locale], count: rest.length })
      : first.productName[locale]
    : '—';
  const totalTon = order.items.reduce((sum, item) => sum + item.itemTon, 0);
  const warehouse = order.warehouse.warehouseName[locale];
  const isPickup = order.orderDeliveryType === 'PICKUP';
  const isPending = order.orderStatus === 'PENDING';

  // Dates are shown in Korea time — where the warehouses are
  const date = (iso: string, withTime = false) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...(withTime && { hour: '2-digit', minute: '2-digit' }),
    }).format(new Date(iso));

  const onPay = () => pay.mutate({ orderId: order.id, memberId, locale }); // leaves the page on success (Toss redirect)

  const onCancel = () => {
    if (window.confirm(t('cancelConfirm'))) cancel.mutate(order.id);
  };

  const error = pay.isError ? t('payError') : cancel.isError ? t('cancelError') : null;
  const rows = [
    { label: t('ordered'), value: date(order.createdAt, true) },
    { label: t('receive'), value: isPickup ? t('pickup') : t('delivery') },
    { label: t('scheduled'), value: order.orderScheduledDate ?? '—' },
    { label: t('warehouse'), value: warehouse },
    ...(isPickup ? [] : [{ label: t('address'), value: order.orderAddress ?? '—' }]),
  ];
  const btn = 'rounded-full px-6 py-2.5 text-sm font-semibold transition disabled:opacity-50';

  return (
    <li className="overflow-hidden rounded-3xl bg-white shadow-[0_14px_40px_rgba(17,55,95,0.08)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-cream/50 sm:px-6"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cream text-brand">
          <Icon d={isPickup ? PICKUP_ICON : TRUCK_ICON} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate font-bold text-heading">{title}</span>
            {order.contractId && (
              <span className="shrink-0 rounded-full border border-brand/30 px-2 py-0.5 text-[11px] font-semibold text-brand">
                {t('fromContract')}
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-[13px] text-muted">
            #{orderNo(order.id)} · {date(order.createdAt)} · {formatTon(totalTon)} {tp('ton')} ·{' '}
            {warehouse.replace(/^Milcow\s*/, '')}
          </span>
        </span>
        <span className="hidden text-right sm:block">
          <span className="block font-extrabold text-heading">
            {formatKrw(order.orderTotal, locale)}
          </span>
        </span>
        <OrderStatusBadge status={order.orderStatus} />
        <svg
          viewBox="0 0 24 24"
          className={`h-5 w-5 shrink-0 text-soft transition ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-line px-5 py-5 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            {/* Items */}
            <div className="min-w-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <th className="pb-2 font-medium">{t('product')}</th>
                    <th className="pb-2 text-right font-medium">{t('quantity')}</th>
                    <th className="hidden pb-2 text-right font-medium sm:table-cell">
                      {t('pricePerTon')}
                    </th>
                    <th className="pb-2 text-right font-medium">{t('amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-t border-line">
                      <td className="py-2.5 font-semibold text-heading">
                        {item.productName[locale]}
                        {item.lotCode && (
                          <Link
                            href={`/passport/${item.lotCode}`}
                            className="mt-0.5 block font-mono text-[11px] font-medium text-brand hover:underline"
                          >
                            🧪 {t('lot', { code: item.lotCode })}
                          </Link>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        {formatTon(item.itemTon)} {tp('ton')}
                      </td>
                      <td className="hidden py-2.5 text-right sm:table-cell">
                        {formatKrw(item.itemPricePerTon, locale)}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-heading">
                        {formatKrw(item.itemTotal, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <dl className="mt-2 space-y-1.5 border-t border-dashed border-line pt-3 text-sm">
                {order.orderServiceFee > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted">{t('serviceFee')}</dt>
                    <dd className="font-semibold text-heading">
                      {formatKrw(order.orderServiceFee, locale)}
                    </dd>
                  </div>
                )}
                <div className="flex items-baseline justify-between">
                  <dt className="text-muted">{t('total')}</dt>
                  <dd className="text-xl font-extrabold text-heading">
                    {formatKrw(order.orderTotal, locale)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Delivery / pickup info */}
            <div className="space-y-3">
              <dl className="space-y-2 rounded-2xl bg-cream px-4 py-3.5 text-sm">
                {rows.map((row) => (
                  <div key={row.label} className="flex justify-between gap-4">
                    <dt className="shrink-0 text-muted">{row.label}</dt>
                    <dd className="truncate text-right font-semibold text-heading">{row.value}</dd>
                  </div>
                ))}
              </dl>

              {isPickup &&
                order.orderStatus !== 'CANCELLED' &&
                (order.pickup ? (
                  <div className="rounded-2xl border-2 border-dashed border-brand/30 px-4 py-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted">{t('pickupCode')}</span>
                      <PickupStatusBadge status={order.pickup.pickupStatus} />
                    </div>
                    <p className="mt-1 font-mono text-2xl font-extrabold tracking-[0.2em] text-heading">
                      {order.pickup.pickupCode}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {t('pickupSlot')}: {date(order.pickup.slotStart, true)}
                    </p>
                  </div>
                ) : (
                  <p className="rounded-2xl bg-[#fff4e0] px-4 py-3 text-xs text-[#8a5300]">
                    {t('pickupNotBooked')}
                  </p>
                ))}
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-[#fdecea] px-4 py-3 text-sm text-[#b42318]"
            >
              {error}
            </p>
          )}

          {order.orderStatus === 'SHIPPING' && (
            // Delivery in progress → follow the (simulated) truck on the map
            <Link
              href={`/map?truck=${truckForOrder(order.id, isDemo)}`}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
            >
              🚚 {t('track')} →
            </Link>
          )}

          {isPending && order.orderHoldUntil && <HoldCountdown until={order.orderHoldUntil} />}

          {isPending && (
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={cancel.isPending || pay.isPending}
                className={`${btn} border border-line text-muted hover:border-[#b42318] hover:text-[#b42318]`}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={onPay}
                disabled={!TOSS_CLIENT_KEY || pay.isPending || cancel.isPending}
                className={`${btn} bg-brand text-white shadow-[0_10px_22px_rgba(32,101,174,0.28)] hover:bg-navy`}
              >
                {pay.isPending
                  ? t('paying')
                  : t('pay', { amount: formatKrw(order.orderTotal, locale) })}
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

const PICKUP_ICON = 'M4 10 12 4l8 6v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1Z';
const TRUCK_ICON =
  'M3 7h11v9H3zM14 10h4l3 3v3h-7M7.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z';

function Icon({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

/** Surplus reservation: "결제 기한 12:34" — the price is only held until then */
function HoldCountdown({ until }: { until: string }) {
  const t = useTranslations('Orders');
  const now = useNow();
  if (now === null) return null;
  const left = new Date(until).getTime() - now;
  if (left <= 0) return null;
  const s = Math.floor(left / 1000);
  const time = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return (
    <p className="mt-4 rounded-xl bg-[#fff4e0] px-4 py-2.5 text-sm font-semibold text-[#b86e00]">
      ⏱ {t('holdLeft', { time })}
    </p>
  );
}
