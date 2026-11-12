'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { DeliveryType, OrderStatus, type Locale } from '@milcow/shared';
import { useAdminOrders } from '@/hooks/useAdmin';
import { useWarehouses } from '@/hooks/useLocations';
import { usePathname, useRouter } from '@/i18n/navigation';
import { formatKrw, formatTon } from '@/lib/format';
import type { AdminOrderFilters } from '@/services/admin.service';
import { OrderStatusBadge } from '@/components/orders/StatusBadge';
import { AdminHeader } from './AdminShell';
import { OrderDrawer } from './OrderDrawer';

const FILTER_KEYS = ['orderStatus', 'orderDeliveryType', 'warehouseId', 'from', 'to', 'q'] as const;
const PAGE_SIZE = 15;

/** /admin/orders — filters live in the URL, so a filtered view can be shared or bookmarked */
export function OrdersAdmin() {
  const t = useTranslations('Admin');
  const to = useTranslations('Orders');
  const locale = useLocale() as Locale;
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { data: warehouses } = useWarehouses();

  const filters: AdminOrderFilters = {
    ...Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) ?? undefined])),
    page: Number(params.get('page') ?? 1) || 1,
    limit: PAGE_SIZE,
  };
  const openId = params.get('open');
  const { data, isPending, isError, isFetching } = useAdminOrders(filters);
  const [search, setSearch] = useState(filters.q ?? '');

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!('page' in changes) && !('open' in changes)) next.delete('page');
    const qs = next.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
  };

  const select =
    'h-10 rounded-xl border border-line bg-white px-3 text-sm text-heading outline-none focus:border-brand';
  const hasFilters = FILTER_KEYS.some((k) => params.get(k));

  return (
    <>
      <AdminHeader title={t('nav.orders')} subtitle={t('orders.subtitle')} />

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-3xl bg-white p-3 shadow-[0_14px_40px_rgba(17,55,95,0.06)]">
        <form
          className="flex min-w-[200px] flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: search.trim() || null });
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('orders.search')}
            className={`${select} w-full`}
          />
        </form>
        <select
          value={filters.orderStatus ?? ''}
          onChange={(e) => update({ orderStatus: e.target.value || null })}
          className={select}
          aria-label={t('orders.status')}
        >
          <option value="">{t('orders.allStatus')}</option>
          {Object.values(OrderStatus).map((s) => (
            <option key={s} value={s}>
              {to(`status.${s}`)}
            </option>
          ))}
        </select>
        <select
          value={filters.orderDeliveryType ?? ''}
          onChange={(e) => update({ orderDeliveryType: e.target.value || null })}
          className={select}
          aria-label={t('orders.type')}
        >
          <option value="">{t('orders.allTypes')}</option>
          {Object.values(DeliveryType).map((d) => (
            <option key={d} value={d}>
              {d === 'PICKUP' ? to('pickup') : to('delivery')}
            </option>
          ))}
        </select>
        <select
          value={filters.warehouseId ?? ''}
          onChange={(e) => update({ warehouseId: e.target.value || null })}
          className={select}
          aria-label={t('orders.warehouse')}
        >
          <option value="">{t('orders.allWarehouses')}</option>
          {(warehouses ?? []).map((w) => (
            <option key={w.id} value={w.id}>
              {w.warehouseName[locale]}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filters.from ?? ''}
          onChange={(e) => update({ from: e.target.value || null })}
          className={select}
          aria-label={t('orders.from')}
        />
        <span className="text-muted">~</span>
        <input
          type="date"
          value={filters.to ?? ''}
          onChange={(e) => update({ to: e.target.value || null })}
          className={select}
          aria-label={t('orders.to')}
        />
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              router.replace(pathname, { scroll: false });
            }}
            className="px-2 text-sm font-semibold text-brand"
          >
            {t('orders.reset')}
          </button>
        )}
      </div>

      <div
        className={`overflow-hidden rounded-3xl bg-white shadow-[0_14px_40px_rgba(17,55,95,0.06)] transition ${isFetching && !isPending ? 'opacity-70' : ''}`}
      >
        {isError ? (
          <p className="p-10 text-center text-muted">{t('errors.generic')}</p>
        ) : isPending ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-cream" />
            ))}
          </div>
        ) : data.list.length === 0 ? (
          <p className="p-12 text-center text-muted">{t('orders.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-cream/70 text-left text-xs text-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">{t('orders.no')}</th>
                  <th className="px-3 py-3 font-semibold">{t('orders.customer')}</th>
                  <th className="px-3 py-3 font-semibold">{t('orders.items')}</th>
                  <th className="px-3 py-3 font-semibold">{t('orders.warehouse')}</th>
                  <th className="px-3 py-3 text-right font-semibold">{to('total')}</th>
                  <th className="px-3 py-3 font-semibold">{t('orders.status')}</th>
                  <th className="px-5 py-3 font-semibold">{t('orders.created')}</th>
                </tr>
              </thead>
              <tbody>
                {data.list.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => update({ open: o.id })}
                    className={`cursor-pointer border-t border-line transition hover:bg-cream/50 ${openId === o.id ? 'bg-cream/70' : ''}`}
                  >
                    <td className="px-5 py-3 font-mono text-xs text-muted">
                      #{o.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-3 py-3">
                      <span className="block max-w-[180px] truncate font-semibold text-heading">
                        {o.customer.companyName ?? o.customer.nick}
                      </span>
                      <span className="block max-w-[180px] truncate text-xs text-muted">
                        {o.customer.email}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="block max-w-[200px] truncate">{o.itemsLabel[locale]}</span>
                      <span className="text-xs text-muted">
                        {formatTon(o.totalTon)} t ·{' '}
                        {o.orderDeliveryType === 'PICKUP' ? to('pickup') : to('delivery')}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted">
                      {o.warehouseName[locale].replace(/^Milcow\s*/, '')}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-heading">
                      {formatKrw(o.orderTotal, locale)}
                    </td>
                    <td className="px-3 py-3">
                      <OrderStatusBadge status={o.orderStatus} />
                    </td>
                    <td className="px-5 py-3 text-xs text-muted">
                      {new Intl.DateTimeFormat(locale, {
                        timeZone: 'Asia/Seoul',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(new Date(o.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm">
            <span className="text-muted">{t('orders.total', { count: data.meta.total })}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={data.meta.page <= 1}
                onClick={() => update({ page: String(data.meta.page - 1) })}
                className="rounded-full border border-line px-3 py-1.5 disabled:opacity-40"
              >
                ←
              </button>
              <span className="font-semibold">
                {data.meta.page} / {data.meta.totalPages}
              </span>
              <button
                type="button"
                disabled={data.meta.page >= data.meta.totalPages}
                onClick={() => update({ page: String(data.meta.page + 1) })}
                className="rounded-full border border-line px-3 py-1.5 disabled:opacity-40"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {openId && <OrderDrawer id={openId} onClose={() => update({ open: null })} />}
    </>
  );
}
