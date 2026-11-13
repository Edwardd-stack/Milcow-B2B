'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@milcow/shared';
import { useAdminStats } from '@/hooks/useAdmin';
import { Link } from '@/i18n/navigation';
import { formatKrw, formatTon } from '@/lib/format';
import { OrderStatusBadge } from '@/components/orders/StatusBadge';
import { AdminHeader, Card } from './AdminShell';
import { RevenueChart } from './RevenueChart';

const todayKst = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());

/** /admin — the numbers an operator checks first in the morning */
export function Dashboard() {
  const t = useTranslations('Admin');
  const locale = useLocale() as Locale;
  const { data: stats, isPending, isError } = useAdminStats();

  if (isError) return <p className="rounded-3xl bg-white p-8 text-muted">{t('errors.generic')}</p>;
  if (isPending || !stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-3xl bg-white" />
        ))}
      </div>
    );
  }

  const today = todayKst();
  const kpis = [
    {
      key: 'today',
      value: String(stats.today.orders),
      sub: formatKrw(stats.today.revenue, locale),
      href: `/admin/orders?from=${today}&to=${today}`,
      tone: 'text-brand',
    },
    {
      key: 'month',
      value: formatKrw(stats.month.revenue, locale),
      sub: t('kpi.monthSub', { count: stats.month.orders }),
      href: `/admin/orders?from=${today.slice(0, 7)}-01&to=${today}`,
      tone: 'text-heading',
    },
    {
      key: 'review',
      value: String(stats.contractsInReview),
      sub: t('kpi.reviewSub'),
      href: '/admin/contracts',
      tone: stats.contractsInReview > 0 ? 'text-accent-dark' : 'text-heading',
    },
    {
      key: 'inquiries',
      value: String(stats.newInquiries),
      sub: t('kpi.inquiriesSub'),
      href: '/admin/inquiries',
      tone: stats.newInquiries > 0 ? 'text-accent-dark' : 'text-heading',
    },
  ] as const;

  return (
    <>
      <AdminHeader title={t('nav.dashboard')} subtitle={t('dashboard.subtitle')} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Link
            key={k.key}
            href={k.href}
            className="group rounded-3xl bg-white p-5 shadow-[0_14px_40px_rgba(17,55,95,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(17,55,95,0.12)]"
          >
            <p className="text-sm font-semibold text-muted">{t(`kpi.${k.key}`)}</p>
            <p className={`mt-2 truncate text-[26px] font-extrabold ${k.tone}`}>{k.value}</p>
            <p className="mt-1 flex items-center justify-between text-xs text-muted">
              {k.sub}
              <span className="text-brand opacity-0 transition group-hover:opacity-100">→</span>
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <h2 className="font-bold text-heading">{t('dashboard.chart')}</h2>
          <RevenueChart daily={stats.daily} />
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-heading">{t('dashboard.lowStock')}</h2>
            <Link href="/admin/products" className="text-xs font-semibold text-brand">
              {t('dashboard.all')} →
            </Link>
          </div>
          {stats.lowStock.length === 0 ? (
            <p className="mt-6 text-sm text-muted">{t('dashboard.noLowStock')}</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {stats.lowStock.map((s) => (
                <li
                  key={`${s.productId}-${s.warehouseName.ko}`}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-heading">
                      {s.productName[locale]}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {s.warehouseName[locale]}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 font-bold ${s.ton < 3 ? 'text-[#b42318]' : 'text-[#b86e00]'}`}
                  >
                    {formatTon(s.ton)} t
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-heading">{t('dashboard.recent')}</h2>
            <Link href="/admin/orders" className="text-xs font-semibold text-brand">
              {t('dashboard.all')} →
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {stats.recentOrders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/orders?open=${o.id}`}
                  className="flex items-center gap-3 py-2.5 text-sm transition hover:bg-cream/60"
                >
                  <span className="w-20 shrink-0 font-mono text-xs text-muted">
                    #{o.id.slice(-8).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-heading">
                      {o.customer.companyName ?? o.customer.nick}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {o.itemsLabel[locale]}
                    </span>
                  </span>
                  <span className="hidden shrink-0 font-semibold text-heading sm:block">
                    {formatKrw(o.orderTotal, locale)}
                  </span>
                  <OrderStatusBadge status={o.orderStatus} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Link
          href="/admin/copilot"
          className="flex flex-col justify-between rounded-3xl bg-gradient-to-br from-brand to-navy p-6 text-white shadow-[0_18px_44px_rgba(17,55,95,0.25)] transition hover:-translate-y-0.5"
        >
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-white/70 uppercase">
              AI Ops Copilot
            </p>
            <h2 className="mt-2 text-xl font-extrabold">{t('copilot.cardTitle')}</h2>
            <p className="mt-2 text-sm text-white/80">{t('copilot.cardText')}</p>
          </div>
          <p className="mt-6 rounded-2xl bg-white/10 px-4 py-3 text-sm">
            “{t('copilot.examples.0')}” →
          </p>
        </Link>
      </div>
    </>
  );
}
