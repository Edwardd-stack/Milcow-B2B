'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@milcow/shared';
import { ArrowRightIcon, ClockIcon, PinIcon, SnowflakeIcon } from '@/components/icons';
import { MilcowMap } from '@/components/map/MilcowMap';
import { Container } from '@/components/ui/Container';
import { useFarms, useWarehouses } from '@/hooks/useLocations';
import { Link } from '@/i18n/navigation';

/** Kakao Map preview: map left, warehouse list right */
export function MapSection() {
  const t = useTranslations('MapSection');
  const locale = useLocale() as Locale;
  const eyebrowText = locale === 'ko' ? 'text-[17px]' : 'text-base';
  const farms = useFarms();
  const warehouses = useWarehouses();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-cream py-20 lg:py-20">
      {/* Decorations (template style): big light circle, dotted square, soft blob */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-40 h-[520px] w-[520px] rounded-full bg-[#e3ecf8]/70" />
        <div className="absolute right-[-120px] bottom-[-160px] h-[420px] w-[420px] rounded-full bg-brand/[0.06]" />
      </div>
      <Container className="relative grid items-center gap-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-[90px]">
        {/* Map card + button under it */}
        <div>
          {/* Map + decorations (only around the map, not the button) */}
          <div className="relative">
            {/* Dots and a blue block peeking out behind the map */}
            <div
              aria-hidden="true"
              className="absolute -top-8 -right-8 h-40 w-40 rounded-2xl bg-[radial-gradient(#7eaee3_1.8px,transparent_1.8px)] [background-size:16px_16px]"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-6 -left-6 h-44 w-56 rounded-3xl bg-[#b5cbe6]"
            />
            <div className="relative overflow-hidden rounded-3xl border-4 border-white shadow-[0_20px_60px_rgba(17,55,95,0.15)]">
              {farms.data && warehouses.data ? (
                <MilcowMap
                  labelMode="hover" // only dots; the name shows on hover → no overlapping labels
                  farms={farms.data}
                  warehouses={warehouses.data}
                  className="h-[420px] w-full lg:h-[500px]"
                />
              ) : (
                <div className="flex h-[420px] items-center justify-center bg-[#e3ecf8] text-muted lg:h-[500px]">
                  {farms.isError || warehouses.isError ? t('dataError') : t('loading')}
                </div>
              )}
              {/* Legend */}
              <div className="pointer-events-none absolute top-4 left-4 z-10 flex gap-2">
                <Legend
                  color="bg-[#4f9a3a]"
                  label={t('farms', { count: farms.data?.length ?? 0 })}
                />
                <Legend
                  color="bg-brand"
                  label={t('warehouses', { count: warehouses.data?.length ?? 0 })}
                />
              </div>
            </div>
          </div>

          <Link
            href="/map"
            className="group relative mt-10 inline-flex items-center gap-3 rounded-full bg-brand py-2 pr-2 pl-7 font-medium text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark"
          >
            {t('button')}
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand transition group-hover:translate-x-1">
              <ArrowRightIcon />
            </span>
          </Link>
        </div>

        {/* Text + warehouse list */}
        <div>
          <p className={`mb-4 font-semibold tracking-[0.2em] text-brand uppercase ${eyebrowText}`}>
            {t('eyebrow')}
          </p>
          <h2 className="text-[clamp(2rem,4.5vw,3.125rem)] leading-[1.12] font-extrabold text-navy uppercase">
            {t('title')}
          </h2>
          <p className="mt-6 leading-relaxed font-light text-muted">{t('text')}</p>

          <ul className="mt-8 space-y-3">
            {warehouses.data?.map((w) => (
              <li
                key={w.id}
                className="group flex items-center gap-4 rounded-2xl border border-white bg-white px-5 py-4 shadow-[0_8px_24px_rgba(17,55,95,0.06)] transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[0_14px_30px_rgba(17,55,95,0.1)]"
              >
                <WarehouseBadge />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-heading">{w.warehouseName[locale]}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                    <PinIcon className="h-4 w-4 shrink-0 text-brand" />
                    <span className="truncate">{w.warehouseAddress}</span>
                  </p>
                  {w.warehouseOpenTime && w.warehouseCloseTime && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                      <ClockIcon className="h-4 w-4 shrink-0 text-brand" />
                      {w.warehouseOpenTime}–{w.warehouseCloseTime}
                    </p>
                  )}
                </div>
                {w.warehouseTempC !== null && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#e6f3fd] px-3 py-1.5 text-sm font-semibold text-[#1f7ac2]">
                    <SnowflakeIcon className="h-4 w-4" />
                    {w.warehouseTempC}°C
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 text-sm font-medium text-heading shadow-md">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} aria-hidden="true" />
      {label}
    </span>
  );
}

/** Small warehouse illustration (blue building with a cold-storage door) */
function WarehouseBadge() {
  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#e6f0fc]">
      <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden="true">
        <path d="M5 16 20 7l15 9v18H5Z" fill="#2065ae" />
        <path
          d="M5 16 20 7l15 9"
          fill="none"
          stroke="#11375f"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <rect x="11" y="20" width="18" height="14" rx="1" fill="#fff" />
        <path d="M11 24.5h18M11 29h18" stroke="#9cc3ef" strokeWidth="1.5" />
        <path d="M20 11.5v4M18 13.5h4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </span>
  );
}
