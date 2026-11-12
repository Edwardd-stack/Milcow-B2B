'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  SURPLUS_MAX_PCT,
  SURPLUS_STEP_HOURS,
  SURPLUS_STEP_PCT,
  type Locale,
  type ProductType,
  type SurplusLot,
} from '@milcow/shared';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { useSurplus } from '@/hooks/useLots';
import { useNow } from '@/hooks/useNow';
import { Link } from '@/i18n/navigation';
import { formatKrw, formatTon } from '@/lib/format';
import { GradeBadges } from '@/components/passport/GradeBadges';
import { ReserveDialog } from './ReserveDialog';

/** Total usable life of a lot (milked → use-by), for the freshness ring */
const LIFE_HOURS = 72;

/** /surplus — surplus raw milk, cheaper the older it gets */
export function SurplusView() {
  const t = useTranslations('Surplus');
  const tp = useTranslations('Product');
  const [type, setType] = useState<ProductType | undefined>();
  const [sort, setSort] = useState<'expiring' | 'price'>('expiring');
  const [reserving, setReserving] = useState<SurplusLot | null>(null);
  const { data, isPending, isError } = useSurplus({ productType: type, sort });
  const now = useNow();

  const types = Array.from(new Set((data ?? []).map((l) => l.productType)));

  return (
    <>
      <PageHero title={t('title')} current={t('title')} />
      <Container>
        <div className="relative -mt-16 mb-24 min-[100rem]:-mt-[calc(6.95vw-1rem)]">
          {/* Why this exists */}
          <section className="rounded-3xl bg-white p-6 shadow-[0_20px_50px_rgba(17,55,95,0.1)] sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
              <div>
                <p className="text-sm font-semibold tracking-[0.18em] text-brand uppercase">
                  {t('eyebrow')}
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-heading">{t('heading')}</h2>
                <p className="mt-3 leading-relaxed text-muted">{t('lead')}</p>
              </div>
              <ul className="space-y-2 rounded-2xl bg-cream p-5 text-sm">
                <li>📉 {t('rule1', { pct: SURPLUS_STEP_PCT, hours: SURPLUS_STEP_HOURS })}</li>
                <li>🛡 {t('rule2', { max: SURPLUS_MAX_PCT })}</li>
                <li>⏱ {t('rule3')}</li>
                <li>🧪 {t('rule4')}</li>
              </ul>
            </div>
          </section>

          {/* Filters */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Chip on={!type} onClick={() => setType(undefined)}>
                {t('all')}
              </Chip>
              {types.map((ty) => (
                <Chip key={ty} on={type === ty} onClick={() => setType(ty)}>
                  {tp(`type.${ty}`)}
                </Chip>
              ))}
            </div>
            <div className="flex rounded-full bg-white p-1 shadow-sm">
              {(['expiring', 'price'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={sort === s}
                  onClick={() => setSort(s)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${sort === s ? 'bg-brand text-white' : 'text-muted'}`}
                >
                  {t(`sort.${s}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            {isError ? (
              <p className="rounded-3xl bg-white px-6 py-14 text-center text-muted">{t('error')}</p>
            ) : isPending || now === null ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-[380px] animate-pulse rounded-3xl bg-white" />
                ))}
              </div>
            ) : (data ?? []).length === 0 ? (
              <div className="rounded-3xl bg-white px-6 py-14 text-center">
                <p className="text-lg font-bold text-heading">{t('empty')}</p>
                <p className="mt-1 text-sm text-muted">{t('emptyText')}</p>
              </div>
            ) : (
              <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {data!.map((lot) => (
                  <SurplusCard
                    key={lot.id}
                    lot={lot}
                    now={now!}
                    onReserve={() => setReserving(lot)}
                  />
                ))}
              </ul>
            )}
          </div>
          <p className="mt-6 text-center text-[11px] text-soft">{t('demoNote')}</p>
        </div>
      </Container>
      {reserving && <ReserveDialog lot={reserving} onClose={() => setReserving(null)} />}
    </>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${on ? 'bg-brand text-white' : 'bg-white text-muted shadow-sm hover:text-heading'}`}
    >
      {children}
    </button>
  );
}

function SurplusCard({
  lot,
  now,
  onReserve,
}: {
  lot: SurplusLot;
  now: number;
  onReserve: () => void;
}) {
  const t = useTranslations('Surplus');
  const locale = useLocale() as Locale;
  const hoursLeft = Math.max(0, (new Date(lot.lotUseBy).getTime() - now) / 3_600_000);
  const share = Math.min(1, hoursLeft / LIFE_HOURS);
  const urgent = hoursLeft < 12;
  const ringColor = urgent ? '#b42318' : hoursLeft < 30 ? '#e08a1e' : '#2f8f4e';
  const nextDrop = lot.nextDropAt ? Math.max(0, new Date(lot.nextDropAt).getTime() - now) : null;
  const soldShare = 1 - lot.lotRemainingTon / lot.lotVolumeTon;

  return (
    <li className="flex flex-col rounded-3xl bg-white p-6 shadow-[0_14px_40px_rgba(17,55,95,0.08)]">
      <div className="flex items-start gap-4">
        {/* Freshness ring: how much of the 72 h life is left */}
        <svg viewBox="0 0 44 44" className="h-16 w-16 shrink-0 -rotate-90" aria-hidden="true">
          <circle cx="22" cy="22" r="19" fill="none" stroke="#eef1f5" strokeWidth="5" />
          <circle
            cx="22"
            cy="22"
            r="19"
            fill="none"
            stroke={ringColor}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${share * 119.4} 119.4`}
          />
        </svg>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-heading">{lot.productName[locale]}</p>
          <p className="truncate text-xs text-muted">
            {lot.farmName[locale]} → {lot.warehouse.warehouseName[locale].replace(/^Milcow\s*/, '')}
          </p>
          <p className={`mt-1 text-sm font-bold ${urgent ? 'text-[#b42318]' : 'text-heading'}`}>
            {t('hoursLeft', { hours: hoursLeft.toFixed(1) })}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[#fdecea] px-2.5 py-1 text-xs font-extrabold text-[#b42318]">
          −{lot.discountPct}%
        </span>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-soft line-through">
            {formatKrw(lot.basePricePerTon, locale)} / t
          </p>
          <p className="text-2xl font-extrabold text-heading">
            {formatKrw(lot.pricePerTon, locale)}{' '}
            <span className="text-sm font-medium text-muted">/ t</span>
          </p>
        </div>
        {nextDrop !== null && (
          <p className="text-right text-xs text-muted">
            {t('nextDrop')}
            <br />
            <b className="font-mono text-sm text-brand">{countdown(nextDrop)}</b>
          </p>
        )}
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-muted">
          <span>{t('remaining', { ton: formatTon(lot.lotRemainingTon) })}</span>
          <span>{t('of', { ton: formatTon(lot.lotVolumeTon) })}</span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-cream">
          <span
            className="block h-full rounded-full bg-brand"
            style={{ width: `${(1 - soldShare) * 100}%` }}
          />
        </div>
      </div>

      <GradeBadges bacteria={lot.lotBacteriaGrade} somatic={lot.lotSomaticGrade} className="mt-4" />

      <div className="mt-auto flex gap-2 pt-5">
        <Link
          href={`/passport/${lot.lotCode}`}
          className="flex-1 rounded-full border border-line py-2.5 text-center text-sm font-semibold text-brand transition hover:border-brand"
        >
          {t('passport')}
        </Link>
        <button
          type="button"
          onClick={onReserve}
          className="flex-1 rounded-full bg-brand py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(32,101,174,0.28)] transition hover:bg-navy"
        >
          {t('reserve')}
        </button>
      </div>
    </li>
  );
}

/** ms → "02:14:09" */
export function countdown(ms: number): string {
  const s = Math.floor(ms / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}
