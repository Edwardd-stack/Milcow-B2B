'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { OrderStatus } from '@milcow/shared';
import { Pagination } from '@/components/products/catalog/Pagination';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { useMe } from '@/hooks/useAuth';
import { useMyOrders } from '@/hooks/useOrders';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { OrderRow } from './OrderRow';

const STATUSES = Object.values(OrderStatus);
const PAGE_SIZE = 8;

/** /orders?status=PAID&page=2 — the tab and page live in the URL (refresh / back keep them) */
export function OrdersView() {
  const t = useTranslations('Orders');
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const raw = params.get('status');
  const status = STATUSES.find((s) => s === raw); // unknown value → "All"
  const page = Math.max(1, Number(params.get('page')) || 1);

  const { data: member, isPending: meLoading } = useMe();
  const { data, isPending, isError, isPlaceholderData } = useMyOrders(
    { page, limit: PAGE_SIZE, orderStatus: status },
    !!member,
  );

  // Guests log in first and come back here
  useEffect(() => {
    if (!meLoading && !member) {
      const here = `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?next=${encodeURIComponent(here)}`);
    }
  }, [meLoading, member, router]);

  const go = (next: { status?: OrderStatus; page?: number }) => {
    const query = new URLSearchParams();
    if (next.status) query.set('status', next.status);
    if (next.page && next.page > 1) query.set('page', String(next.page));
    const qs = query.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const orders = data?.list ?? [];
  const tabs: { key: OrderStatus | undefined; label: string }[] = [
    { key: undefined, label: t('all') },
    ...STATUSES.map((s) => ({ key: s, label: t(`status.${s}`) })),
  ];

  return (
    <>
      <PageHero title={t('title')} current={t('title')} />
      <Container>
        <div className="relative -mt-16 pb-24 min-[100rem]:-mt-[calc(6.95vw-1rem)]">
          <div className="rounded-3xl bg-white p-3 shadow-[0_14px_40px_rgba(17,55,95,0.08)]">
            <div
              role="tablist"
              aria-label={t('title')}
              className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]"
            >
              {tabs.map((tab) => {
                const on = tab.key === status;
                return (
                  <button
                    key={tab.key ?? 'ALL'}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => go({ status: tab.key })}
                    className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition ${
                      on ? 'bg-brand text-white' : 'text-muted hover:bg-cream hover:text-heading'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            {isError ? (
              <p className="rounded-3xl bg-white px-6 py-14 text-center text-muted">{t('error')}</p>
            ) : !member || isPending ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-[92px] animate-pulse rounded-3xl bg-white" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-3xl bg-white px-6 py-16 text-center">
                <p className="text-lg font-bold text-heading">{t('empty')}</p>
                <Link
                  href="/products"
                  className="mt-6 inline-block rounded-full bg-brand px-8 py-3.5 font-semibold text-white transition hover:bg-navy"
                >
                  {t('emptyCta')}
                </Link>
              </div>
            ) : (
              <ul
                className={`space-y-3 transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}
              >
                {orders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    memberId={member.id}
                    isDemo={member.memberIsDemo}
                  />
                ))}
              </ul>
            )}
          </div>

          {data && (
            <div className="mt-8">
              <Pagination
                page={page}
                totalPages={data.meta.totalPages}
                onChange={(p) => go({ status, page: p })}
              />
            </div>
          )}
        </div>
      </Container>
    </>
  );
}
