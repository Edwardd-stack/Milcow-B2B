'use client';

import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { formatBizNo } from '@/components/auth/formatBizNo';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { useMe } from '@/hooks/useAuth';
import { useContracts } from '@/hooks/useContracts';
import { useMyOrders } from '@/hooks/useOrders';
import { Link, useRouter } from '@/i18n/navigation';

const block = 'rounded-3xl bg-white shadow-[0_14px_40px_rgba(17,55,95,0.08)]';

/** /profile — read-only company account details + shortcuts to orders and contracts */
export function ProfileView() {
  const t = useTranslations('Profile');
  const locale = useLocale();
  const router = useRouter();
  const { data: member, isPending: meLoading } = useMe();

  // limit 1: only the totals in `meta` are needed, not the rows
  const { data: orders } = useMyOrders({ limit: 1 }, !!member);
  const { data: waiting } = useMyOrders({ limit: 1, orderStatus: 'PENDING' }, !!member);
  const { data: contracts } = useContracts(!!member);
  const activeContracts = contracts?.list.filter((c) => c.contractStatus === 'ACTIVE').length;

  useEffect(() => {
    if (!meLoading && !member) router.replace('/login?next=/profile');
  }, [meLoading, member, router]);

  const shell =
    'relative -mt-16 grid gap-6 pb-24 min-[100rem]:-mt-[calc(6.95vw-1rem)] lg:grid-cols-[minmax(0,1fr)_360px]';

  if (!member) {
    return (
      <>
        <PageHero title={t('title')} current={t('title')} />
        <Container>
          <div className={shell}>
            <div className={`${block} h-[420px] animate-pulse`} />
            <div className={`${block} h-[300px] animate-pulse`} />
          </div>
        </Container>
      </>
    );
  }

  const name = member.memberCompanyName ?? member.memberNick;
  const joined = new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(
    new Date(member.createdAt),
  );
  const rows = [
    { label: t('company'), value: member.memberCompanyName },
    { label: t('bizNo'), value: member.memberBizNo && formatBizNo(member.memberBizNo) },
    { label: t('contact'), value: member.memberNick },
    { label: t('email'), value: member.memberEmail },
    { label: t('phone'), value: member.memberPhone },
    { label: t('type'), value: t(`types.${member.memberType}`) },
    { label: t('joined'), value: joined },
  ];
  const stats = [
    { label: t('stats.orders'), value: orders?.meta.total, href: '/orders' },
    { label: t('stats.waiting'), value: waiting?.meta.total, href: '/orders?status=PENDING' },
    { label: t('stats.contracts'), value: activeContracts, href: '/contracts#my-contracts' },
  ];

  return (
    <>
      <PageHero title={t('title')} current={t('title')} />
      <Container>
        <div className={shell}>
          <section className={`${block} p-6 sm:p-8`}>
            <div className="flex items-center gap-4 border-b border-line pb-6">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-brand text-2xl font-extrabold text-white">
                {name
                  .replace(/^\(.+?\)/, '')
                  .trim()
                  .charAt(0)}
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-extrabold text-heading">{name}</h2>
                <p className="truncate text-sm text-muted">{member.memberEmail}</p>
              </div>
            </div>
            <dl className="mt-2 divide-y divide-line">
              {rows.map((row) => (
                <div key={row.label} className="flex justify-between gap-6 py-3.5 text-[15px]">
                  <dt className="shrink-0 text-muted">{row.label}</dt>
                  <dd className="truncate text-right font-semibold text-heading">
                    {row.value || '—'}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 rounded-2xl bg-cream px-4 py-3 text-sm text-muted">
              {t('changeHint')}{' '}
              <Link href="/contact" className="font-semibold text-brand hover:underline">
                {t('contactUs')}
              </Link>
            </p>
          </section>

          <aside className="space-y-4 self-start">
            {stats.map((stat) => (
              <Link
                key={stat.label}
                href={stat.href}
                className={`${block} group flex items-center justify-between px-6 py-5 transition hover:-translate-y-0.5`}
              >
                <span>
                  <span className="block text-sm text-muted">{stat.label}</span>
                  <span className="text-3xl font-extrabold text-heading">{stat.value ?? '–'}</span>
                </span>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-cream text-brand transition group-hover:bg-brand group-hover:text-white">
                  →
                </span>
              </Link>
            ))}
          </aside>
        </div>
      </Container>
    </>
  );
}
