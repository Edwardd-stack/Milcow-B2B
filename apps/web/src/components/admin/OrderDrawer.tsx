'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale, OrderInfo, OrderStatus } from '@milcow/shared';
import { useAdminOrder, useOrderAction } from '@/hooks/useAdmin';
import { Link } from '@/i18n/navigation';
import { formatKrw, formatTon } from '@/lib/format';
import { OrderStatusBadge, PickupStatusBadge } from '@/components/orders/StatusBadge';
import { apiErrorText } from './AdminShell';

/** The next step(s) an admin may take — mirrors ORDER_STATUS_FLOW on the server */
function nextSteps(order: OrderInfo): OrderStatus[] {
  switch (order.orderStatus) {
    case 'PAID':
      return ['PREPARING'];
    case 'PREPARING':
      return [order.orderDeliveryType === 'PICKUP' ? 'READY_FOR_PICKUP' : 'SHIPPING'];
    case 'SHIPPING':
    case 'READY_FOR_PICKUP':
      return ['COMPLETED'];
    default:
      return [];
  }
}

/** Right-side panel: order detail, payment, history and the allowed actions */
export function OrderDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const t = useTranslations('Admin');
  const to = useTranslations('Orders');
  const locale = useLocale() as Locale;
  const { data: order, isPending } = useAdminOrder(id);
  const action = useOrderAction();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const dateTime = (iso: string) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: 'Asia/Seoul',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));

  const error = apiErrorText(action.error, t);
  const canCancel = order && (order.orderStatus === 'PENDING' || order.orderStatus === 'PAID');
  const paid = order?.payment?.paymentStatus === 'DONE';

  return (
    <div className="fixed inset-0 z-[70] flex justify-end" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label={t('close')}
        onClick={onClose}
        className="absolute inset-0 bg-navy/30 backdrop-blur-[2px]"
      />
      <aside className="relative flex h-full w-full max-w-[520px] flex-col overflow-y-auto bg-white shadow-[-20px_0_60px_rgba(17,55,95,0.2)]">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-white px-6 py-4">
          <div>
            <p className="font-mono text-xs text-muted">#{id.slice(-8).toUpperCase()}</p>
            <p className="font-bold text-heading">{t('orders.detail')}</p>
          </div>
          <div className="flex items-center gap-3">
            {order && <OrderStatusBadge status={order.orderStatus} />}
            <button
              type="button"
              onClick={onClose}
              aria-label={t('close')}
              className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-cream"
            >
              ✕
            </button>
          </div>
        </div>

        {isPending || !order ? (
          <div className="space-y-3 p-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-cream" />
            ))}
          </div>
        ) : (
          <div className="space-y-6 p-6 text-sm">
            {/* Customer */}
            {order.customer && (
              <section>
                <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">
                  {t('orders.customer')}
                </h3>
                <p className="mt-1.5 font-bold text-heading">
                  {order.customer.companyName ?? order.customer.nick}
                  {order.customer.isDemo && (
                    <span className="ml-2 rounded-full bg-cream px-2 py-0.5 text-[11px] text-brand">
                      DEMO
                    </span>
                  )}
                </p>
                <p className="text-muted">
                  {order.customer.nick} · {order.customer.email}
                  {order.customer.phone && ` · ${order.customer.phone}`}
                </p>
              </section>
            )}

            {/* Items */}
            <section>
              <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">
                {t('orders.items')}
              </h3>
              <ul className="mt-2 divide-y divide-line rounded-2xl border border-line">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-heading">
                        {item.productName[locale]}
                      </span>
                      <span className="text-xs text-muted">
                        {formatTon(item.itemTon)} t × {formatKrw(item.itemPricePerTon, locale)}
                        {item.lotCode && (
                          <Link
                            href={`/passport/${item.lotCode}`}
                            className="ml-2 font-mono text-brand hover:underline"
                          >
                            {item.lotCode}
                          </Link>
                        )}
                      </span>
                    </span>
                    <span className="shrink-0 font-semibold">
                      {formatKrw(item.itemTotal, locale)}
                    </span>
                  </li>
                ))}
                <li className="flex justify-between bg-cream/60 px-4 py-2.5 font-bold text-heading">
                  {to('total')} <span>{formatKrw(order.orderTotal, locale)}</span>
                </li>
              </ul>
              <p className="mt-2 text-xs text-muted">
                {order.orderDeliveryType === 'PICKUP' ? to('pickup') : to('delivery')} ·{' '}
                {order.warehouse.warehouseName[locale]}
                {order.orderAddress && ` · ${order.orderAddress}`}
              </p>
              {order.pickup && (
                <p className="mt-2 flex items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-heading">
                    {order.pickup.pickupCode}
                  </span>
                  <PickupStatusBadge status={order.pickup.pickupStatus} />
                </p>
              )}
            </section>

            {/* Payment */}
            <section>
              <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">
                {t('orders.payment')}
              </h3>
              {order.payment ? (
                <p className="mt-1.5 text-heading">
                  <b>{t(`orders.paymentStatus.${order.payment.paymentStatus}`)}</b> ·{' '}
                  {formatKrw(order.payment.paymentAmount, locale)}
                  {order.payment.paymentMethod && ` · ${order.payment.paymentMethod}`}
                  {order.payment.isDemo && (
                    <span className="ml-2 text-xs text-muted">({t('orders.demoPayment')})</span>
                  )}
                </p>
              ) : (
                <p className="mt-1.5 text-muted">{t('orders.noPayment')}</p>
              )}
            </section>

            {/* History */}
            <section>
              <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">
                {t('orders.history')}
              </h3>
              <ol className="mt-3 space-y-0">
                {(order.events ?? []).map((e, i, all) => (
                  <li key={e.id} className="relative flex gap-3 pb-4">
                    {i < all.length - 1 && (
                      <span className="absolute top-3 left-[5px] h-full w-px bg-line" />
                    )}
                    <span
                      className={`relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full ring-4 ring-white ${
                        e.eventType === 'REFUNDED' || e.eventType === 'CANCELLED'
                          ? 'bg-[#b42318]'
                          : i === all.length - 1
                            ? 'bg-brand'
                            : 'bg-[#9cc0e8]'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-heading">
                        {t(`orders.event.${e.eventType}`)}
                        {e.eventTo && e.eventType !== 'REFUNDED' && (
                          <span className="font-normal text-muted">
                            {' '}
                            → {to(`status.${e.eventTo as OrderStatus}`)}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted">
                        {dateTime(e.createdAt)} · {e.actor ? e.actor.nick : t('orders.system')}
                        {e.eventNote && ` · ${e.eventNote}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {error && (
              <p role="alert" className="rounded-xl bg-[#fdecea] px-4 py-3 text-[#b42318]">
                {error}
              </p>
            )}

            {/* Actions */}
            <section className="flex flex-wrap gap-2 border-t border-line pt-5">
              {nextSteps(order).map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={action.isPending}
                  onClick={() => action.mutate({ id: order.id, status })}
                  className="rounded-full bg-brand px-5 py-2.5 font-semibold text-white transition hover:bg-navy disabled:opacity-50"
                >
                  → {to(`status.${status}`)}
                </button>
              ))}
              {canCancel && !cancelOpen && (
                <button
                  type="button"
                  onClick={() => setCancelOpen(true)}
                  className="rounded-full border border-line px-5 py-2.5 font-semibold text-muted transition hover:border-[#b42318] hover:text-[#b42318]"
                >
                  {paid ? t('orders.cancelRefund') : t('orders.cancel')}
                </button>
              )}
            </section>

            {cancelOpen && (
              <form
                className="space-y-3 rounded-2xl bg-[#fff6f5] p-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  action.mutate(
                    { id: order.id, cancel: reason.trim() },
                    { onSuccess: () => setCancelOpen(false) },
                  );
                }}
              >
                <p className="font-semibold text-[#b42318]">
                  {paid
                    ? t('orders.refundNote', {
                        amount: formatKrw(order.payment!.paymentAmount, locale),
                      })
                    : t('orders.cancelNote')}
                </p>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={200}
                  placeholder={t('orders.reasonPlaceholder')}
                  className="h-11 w-full rounded-xl border border-line bg-white px-3 outline-none focus:border-brand"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCancelOpen(false)}
                    className="rounded-full px-4 py-2 text-muted"
                  >
                    {t('back')}
                  </button>
                  <button
                    type="submit"
                    disabled={action.isPending}
                    className="rounded-full bg-[#b42318] px-5 py-2 font-semibold text-white disabled:opacity-50"
                  >
                    {paid ? t('orders.confirmRefund') : t('orders.confirmCancel')}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
