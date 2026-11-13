'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@milcow/shared';
import {
  DEMO_DELIVERY_TRUCK,
  POINTS,
  truckStateAt,
  type TruckDay,
  type TruckState,
} from '@/lib/fleet/fleet-sim';
import type { ClockMode } from '@/lib/fleet/useFleetClock';
import { formatTon } from '@/lib/format';
import { PHASE_COLOR } from './useFleetLayer';

interface FleetPanelProps {
  days: TruckDay[];
  now: () => number;
  mode: ClockMode;
  onMode: (mode: ClockMode) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** "실시간 물류 현황": summary + one card per truck. Re-computed once a second from the same clock. */
export function FleetPanel({ days, now, mode, onMode, selectedId, onSelect }: FleetPanelProps) {
  const t = useTranslations('MapPage.fleet');
  const locale = useLocale() as Locale;
  const [time, setTime] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setTime(now());
    tick();
    const id = setInterval(tick, mode === 'timelapse' ? 250 : 1000);
    return () => clearInterval(id);
  }, [now, mode]);

  if (time === null) return <div className="h-[420px] animate-pulse rounded-3xl bg-white" />;
  const states = days.map((d) => truckStateAt(d, time));

  const fmt = (ms: number | null) =>
    ms === null
      ? '—'
      : new Intl.DateTimeFormat(locale, {
          timeZone: 'Asia/Seoul',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(ms);

  const moving = states.filter((s) => s.phase === 'DRIVING');
  const summary = [
    { label: t('summary.onRoad'), value: `${moving.length} / ${states.length}` },
    {
      label: t('summary.tons'),
      value: `${formatTon(moving.reduce((sum, s) => sum + s.cargoTon, 0))} t`,
    },
    {
      label: t('summary.avgTemp'),
      value: `${(states.reduce((sum, s) => sum + s.tempC, 0) / states.length).toFixed(1)}℃`,
    },
    {
      label: t('summary.trips'),
      value: String(states.reduce((sum, s) => sum + s.tripsDone, 0)),
    },
  ];

  return (
    <section aria-labelledby="fleet-title" className="mb-24">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="fleet-title" className="text-[24px] font-extrabold text-heading">
            {t('title')}
          </h2>
          <p className="mt-1 text-sm text-muted">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-white px-3.5 py-2 font-mono text-sm font-bold text-heading shadow-sm">
            🕒 {fmt(time)}
          </span>
          <div role="group" className="flex rounded-full bg-white p-1 shadow-sm">
            {(['live', 'timelapse'] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => onMode(m)}
                title={m === 'timelapse' ? t('timelapseHint') : undefined}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  mode === m ? 'bg-brand text-white' : 'text-muted hover:text-heading'
                }`}
              >
                {t(m)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <dl className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl bg-white px-5 py-4 shadow-[0_10px_30px_rgba(17,55,95,0.06)]"
          >
            <dt className="text-xs text-muted">{s.label}</dt>
            <dd className="mt-1 text-xl font-extrabold text-heading">{s.value}</dd>
          </div>
        ))}
      </dl>

      <ul className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-3">
        {states.map((s) => (
          <TruckCard
            key={s.id}
            state={s}
            selected={s.id === selectedId}
            onSelect={() => onSelect(s.id)}
            fmt={fmt}
            locale={locale}
          />
        ))}
      </ul>
    </section>
  );
}

function TruckCard({
  state: s,
  selected,
  onSelect,
  fmt,
  locale,
}: {
  state: TruckState;
  selected: boolean;
  onSelect: () => void;
  fmt: (ms: number | null) => string;
  locale: Locale;
}) {
  const t = useTranslations('MapPage.fleet');
  const tp = useTranslations('Product');
  const driving = s.phase === 'DRIVING' || s.phase === 'RETURNING';
  const fill = Math.min(100, (s.cargoTon / s.capacityTon) * 100);
  const free = Math.max(0, s.capacityTon - s.cargoTon);

  const line =
    s.phase === 'OFF'
      ? s.departAt
        ? t('nextDepart', { time: fmt(s.departAt) })
        : t('offHours')
      : null;

  return (
    <li className="w-[290px] shrink-0 snap-start sm:w-auto">
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={`h-full w-full rounded-3xl bg-white p-5 text-left shadow-[0_14px_40px_rgba(17,55,95,0.08)] ring-2 transition hover:-translate-y-0.5 ${
          selected ? 'ring-brand' : 'ring-transparent'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-heading">
              {s.id} <span className="font-mono text-sm font-semibold text-muted">{s.plate}</span>
            </p>
            <p className="text-xs text-muted">
              {t(`kind.${s.kind}`)} · {s.capacityTon} t
            </p>
          </div>
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
            style={{ background: PHASE_COLOR[s.phase] }}
          >
            {t(`phase.${s.phase}`)}
          </span>
        </div>

        <p className="mt-3 truncate text-sm font-semibold text-heading">
          {POINTS[s.from].name[locale]} → {POINTS[s.to].name[locale]}
        </p>
        {s.id === DEMO_DELIVERY_TRUCK && (
          <p className="mt-1 inline-block rounded-full bg-[#fff4e0] px-2 py-0.5 text-[11px] font-semibold text-[#b86e00]">
            {t('demoOrder')}
          </p>
        )}

        {line ? (
          <p className="mt-3 text-sm text-muted">{line}</p>
        ) : (
          <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div>
              <dt className="text-muted">{t('depart')}</dt>
              <dd className="font-semibold text-heading">{fmt(s.departAt)}</dd>
            </div>
            <div>
              <dt className="text-muted">{t('eta')}</dt>
              <dd className="font-semibold text-heading">{fmt(s.etaAt)}</dd>
            </div>
            <div>
              <dt className="text-muted">{t('remaining')}</dt>
              <dd className="font-semibold text-heading">
                {driving ? `${s.remainingKm} km` : '—'}
              </dd>
            </div>
          </dl>
        )}

        {driving && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
            <span
              className="block h-full rounded-full bg-brand"
              style={{ width: `${s.progress * 100}%` }}
            />
          </div>
        )}

        <div className="mt-4 border-t border-line pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">
              {s.cargo ? `${t('cargo')} · ${tp(`type.${s.cargo}`)}` : t('empty')}
            </span>
            <span className="font-semibold text-heading">
              {formatTon(s.cargoTon)} / {s.capacityTon} t
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-cream">
            <span
              className="block h-full rounded-full bg-[#2fbf71]"
              style={{ width: `${fill}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-muted">
              {t('free')} <b className="text-heading">{formatTon(free)} t</b>
            </span>
            <span className="font-semibold text-brand">❄ {s.tempC.toFixed(1)}℃</span>
          </div>
          <p className="mt-2 text-[11px] text-soft">
            {t('trips', { done: s.tripsDone, total: s.tripsTotal })}
          </p>
        </div>
      </button>
    </li>
  );
}
