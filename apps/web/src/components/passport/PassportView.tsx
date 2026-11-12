'use client';

import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale, LotPassport } from '@milcow/shared';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { QrCode } from '@/components/ui/QrCode';
import { usePassport } from '@/hooks/useLots';
import { Link } from '@/i18n/navigation';
import { ApiRequestError } from '@/lib/api-client';
import { formatTon } from '@/lib/format';
import { GradeBadges } from './GradeBadges';
import { RouteMiniMap } from './RouteMiniMap';
import { TempChart } from './TempChart';

const noop = () => () => {};
const card = 'rounded-3xl bg-white p-6 shadow-[0_14px_40px_rgba(17,55,95,0.08)] sm:p-7';

/** /passport/[code] — the full story of one milk lot */
export function PassportView() {
  const t = useTranslations('Passport');
  const { code } = useParams<{ code: string }>();
  const lotCode = decodeURIComponent(code ?? '').toUpperCase();
  const { data: lot, isPending, error } = usePassport(lotCode);
  const notFound = error instanceof ApiRequestError && error.status === 404;

  // Tab title: "ML-20261113-ICN-01 · 원유 품질 여권 | Milcow"
  useEffect(() => {
    document.title = `${lotCode} · ${t('title')} | Milcow`;
  }, [lotCode, t]);
  const parent = { label: t('title'), href: '/passport' };

  return (
    <>
      <PageHero title={t('title')} current={lotCode} parent={parent} />
      <Container>
        <div className="relative -mt-16 mb-24 min-[100rem]:-mt-[calc(6.95vw-1rem)]">
          {error ? (
            <div className={`${card} mx-auto max-w-xl text-center`}>
              <p className="text-xl font-bold text-heading">
                {notFound ? t('notFound') : t('error')}
              </p>
              <p className="mt-2 font-mono text-muted">{lotCode}</p>
              <Link
                href="/passport"
                className="mt-6 inline-block rounded-full bg-brand px-7 py-3 font-semibold text-white hover:bg-navy"
              >
                {t('back')}
              </Link>
            </div>
          ) : isPending || !lot ? (
            <div className="grid gap-6 lg:grid-cols-3">
              {[260, 260, 260].map((h, i) => (
                <div key={i} className="animate-pulse rounded-3xl bg-white" style={{ height: h }} />
              ))}
            </div>
          ) : (
            <Passport lot={lot} />
          )}
        </div>
      </Container>
    </>
  );
}

function Passport({ lot }: { lot: LotPassport }) {
  const t = useTranslations('Passport');
  const tc = useTranslations('MapPage.cert');
  const locale = useLocale() as Locale;
  // The page URL for the share QR: '' on the server, the real address in the browser
  const url = useSyncExternalStore(
    noop,
    () => window.location.href,
    () => '',
  );

  const dt = new Intl.DateTimeFormat(locale, {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const from = useMemo(
    () => ({
      lat: lot.farm.farmLat,
      lng: lot.farm.farmLng,
      label: lot.farm.farmName[locale],
      color: '#4f9a3a',
    }),
    [lot, locale],
  );
  const to = useMemo(
    () => ({
      lat: lot.warehouse.warehouseLat,
      lng: lot.warehouse.warehouseLng,
      label: lot.warehouse.warehouseName[locale],
      color: '#2065ae',
    }),
    [lot, locale],
  );

  const steps = [
    { key: 'milked', at: lot.lotMilkedAt, where: lot.farm.farmName[locale] },
    { key: 'collected', at: lot.lotCollectedAt, where: t('collectTruck') },
    { key: 'arrived', at: lot.lotArrivedAt, where: lot.warehouse.warehouseName[locale] },
    { key: 'useBy', at: lot.lotUseBy, where: t('useByNote') },
  ] as const;

  const importHours = lot.importTransitDays * 24;
  const lab = [
    {
      key: 'bacteria',
      value: `${lot.lotBacteriaCount.toLocaleString(locale)} /mL`,
      note: t('lab.bacteriaNote'),
    },
    {
      key: 'somatic',
      value: `${lot.lotSomaticCount.toLocaleString(locale)} /mL`,
      note: t('lab.somaticNote'),
    },
    { key: 'fat', value: `${lot.lotFatPct}%`, note: t('lab.fatNote') },
    { key: 'protein', value: `${lot.lotProteinPct}%`, note: t('lab.proteinNote') },
    { key: 'antibiotic', value: t(`lab.${lot.lotAntibiotic}`), note: t('lab.antibioticNote') },
  ] as const;
  const farmShare = lot.co2e.totalKg ? (lot.co2e.farmKg / lot.co2e.totalKg) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section
        className={`${card} flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between`}
      >
        <div>
          <p className="font-mono text-sm font-bold tracking-wide text-brand">{lot.lotCode}</p>
          <h2 className="mt-1 text-2xl font-extrabold text-heading">{lot.productName[locale]}</h2>
          <p className="text-muted">
            {lot.farm.farmName[locale]} · {formatTon(lot.lotVolumeTon)} t
            {lot.farm.farmCertifications.length > 0 &&
              ` · ${lot.farm.farmCertifications.map((c) => tc(c)).join(', ')}`}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <GradeBadges bacteria={lot.lotBacteriaGrade} somatic={lot.lotSomaticGrade} />
            <span className="rounded-full bg-[#e7f6ec] px-2.5 py-1 text-[11px] font-bold text-[#2f8f4e]">
              {t('antibioticBadge')}
            </span>
            <span className="rounded-full bg-[#eef1f5] px-2.5 py-1 text-[11px] font-semibold text-muted">
              {t(`status.${lot.lotStatus}`)}
            </span>
          </div>
        </div>
        {/* Big freshness number */}
        <div className="rounded-3xl bg-brand px-7 py-5 text-white lg:text-right">
          <p className="text-sm text-white/80">{t('freshLabel')}</p>
          <p className="text-4xl font-extrabold">
            {t('hours', { hours: lot.farmToWarehouseHours })}
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          {/* Timeline */}
          <section className={card}>
            <h3 className="mb-5 text-lg font-bold text-heading">{t('timeline')}</h3>
            <ol className="relative space-y-5 border-l-2 border-dashed border-line pl-6">
              {steps.map((s) => (
                <li key={s.key} className="relative">
                  <span className="absolute top-1 -left-[33px] h-4 w-4 rounded-full border-4 border-white bg-brand shadow" />
                  <p className="text-sm font-semibold text-heading">{t(`step.${s.key}`)}</p>
                  <p className="text-sm text-muted">
                    {dt.format(new Date(s.at))} · {s.where}
                  </p>
                </li>
              ))}
            </ol>

            {/* Freshness vs imports */}
            <div className="mt-7 rounded-2xl bg-cream p-5">
              <p className="mb-3 text-sm font-semibold text-heading">{t('compareTitle')}</p>
              <div className="space-y-2.5 text-sm">
                <div>
                  <div className="flex justify-between text-xs text-muted">
                    <span>{t('compareThis')}</span>
                    <b className="text-brand">{t('hours', { hours: lot.farmToWarehouseHours })}</b>
                  </div>
                  <div className="mt-1 h-3 rounded-full bg-white">
                    <span
                      className="block h-full rounded-full bg-brand"
                      style={{
                        width: `${Math.max(2, (lot.farmToWarehouseHours / importHours) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-muted">
                    <span>{t('compareImport')}</span>
                    <b className="text-heading">
                      {t('weeks', { weeks: Math.round(lot.importTransitDays / 7) })}
                    </b>
                  </div>
                  <div className="mt-1 h-3 rounded-full bg-[#9aa5b1]" />
                </div>
              </div>
              <p className="mt-3 text-[11px] text-soft">{t('compareNote')}</p>
            </div>
          </section>

          {/* Temperature */}
          <section className={card}>
            <h3 className="mb-1 text-lg font-bold text-heading">{t('temp.title')}</h3>
            <p className="mb-4 text-sm text-muted">{t('temp.lead')}</p>
            <TempChart points={lot.lotTempLog} />
          </section>

          {/* Lab */}
          <section className={card}>
            <h3 className="mb-4 text-lg font-bold text-heading">{t('lab.title')}</h3>
            <dl className="grid gap-3 sm:grid-cols-2">
              {lab.map((row) => (
                <div key={row.key} className="rounded-2xl bg-cream px-4 py-3">
                  <dt className="text-xs text-muted">{t(`lab.${row.key}`)}</dt>
                  <dd className="text-lg font-extrabold text-heading">{row.value}</dd>
                  <p className="mt-0.5 text-[11px] leading-snug text-soft">{row.note}</p>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <aside className="space-y-6">
          <section className={`${card} overflow-hidden p-0 sm:p-0`}>
            <div className="h-[260px]">
              <RouteMiniMap from={from} to={to} />
            </div>
            <p className="px-6 py-4 text-sm text-muted">
              {lot.farm.farmAddress} → {lot.warehouse.warehouseName[locale]}
            </p>
          </section>

          {/* CO2e */}
          <section className={card}>
            <h3 className="text-lg font-bold text-heading">{t('co2.title')}</h3>
            <p className="mt-1 text-3xl font-extrabold text-heading">
              {t('co2.perLiter', { g: lot.co2e.perLiterG.toLocaleString(locale) })}
            </p>
            <p className="text-sm text-muted">
              {t('co2.total', { kg: lot.co2e.totalKg.toLocaleString(locale) })}
            </p>
            <div className="mt-4 flex h-3 overflow-hidden rounded-full">
              <span className="bg-[#4f9a3a]" style={{ width: `${farmShare}%` }} />
              <span className="flex-1 bg-brand" />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted">
              <span>{t('co2.farm', { kg: lot.co2e.farmKg.toLocaleString(locale) })}</span>
              <span>{t('co2.transport', { kg: lot.co2e.transportKg.toLocaleString(locale) })}</span>
            </div>
            <details className="mt-4 text-xs text-muted">
              <summary className="cursor-pointer font-semibold text-brand">
                {t('co2.method')}
              </summary>
              <p className="mt-2 leading-relaxed">{t('co2.methodText')}</p>
            </details>
          </section>

          {/* Share */}
          <section className={`${card} flex items-center gap-5`}>
            {url && <QrCode value={url} size={112} />}
            <div className="min-w-0">
              <p className="font-semibold text-heading">{t('share')}</p>
              <p className="mt-1 text-xs text-muted">{t('shareText')}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(url).catch(() => undefined)}
                  className="rounded-full border border-brand px-4 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-white"
                >
                  {t('copy')}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-full border border-line px-4 py-1.5 text-xs font-semibold text-muted hover:border-brand hover:text-brand"
                >
                  {t('print')}
                </button>
              </div>
            </div>
          </section>
          <p className="text-center text-[11px] text-soft">{t('demoNote')}</p>
        </aside>
      </div>
    </div>
  );
}
