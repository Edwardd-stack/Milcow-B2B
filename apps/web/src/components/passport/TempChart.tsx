'use client';

import { useLocale, useTranslations } from 'next-intl';
import { RAW_MILK_MAX_TEMP_C, type LotTempPoint } from '@milcow/shared';

const W = 640;
const H = 220;
const PAD = { top: 16, right: 16, bottom: 34, left: 40 };
const STAGE_COLOR: Record<string, string> = {
  MILKING: '#e08a1e',
  FARM_TANK: '#4f9a3a',
  TRANSPORT: '#2065ae',
  WAREHOUSE: '#11375f',
};

/**
 * Cold-chain temperature over time (SVG). The first point is body temperature right after milking;
 * then it must stay at or below 5 °C — the dashed line.
 */
export function TempChart({ points }: { points: LotTempPoint[] }) {
  const t = useTranslations('Passport.temp');
  const locale = useLocale();
  if (points.length < 2) return <p className="text-sm text-muted">{t('empty')}</p>;

  const times = points.map((p) => new Date(p.at).getTime());
  const t0 = Math.min(...times);
  const t1 = Math.max(...times);
  const maxC = Math.max(38, ...points.map((p) => p.c));
  const x = (ms: number) => PAD.left + ((ms - t0) / (t1 - t0 || 1)) * (W - PAD.left - PAD.right);
  const y = (c: number) => PAD.top + (1 - c / maxC) * (H - PAD.top - PAD.bottom);

  const line = points
    .map((p, i) => `${i ? 'L' : 'M'}${x(times[i]!).toFixed(1)},${y(p.c).toFixed(1)}`)
    .join(' ');
  const after = points.slice(2); // after the initial cooling
  const maxAfter = after.length ? Math.max(...after.map((p) => p.c)) : null;
  const hour = new Intl.DateTimeFormat(locale, {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    hour12: false,
  });
  const ticks = [t0, t0 + (t1 - t0) / 2, t1];

  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={t('aria', { max: maxAfter?.toFixed(1) ?? '—' })}
      >
        {[0, 10, 20, 30].map((c) => (
          <g key={c}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(c)} y2={y(c)} stroke="#e5e7eb" />
            <text
              x={PAD.left - 8}
              y={y(c) + 4}
              textAnchor="end"
              className="fill-[#9b9b9b] text-[11px]"
            >
              {c}℃
            </text>
          </g>
        ))}
        {/* 5 °C limit */}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={y(RAW_MILK_MAX_TEMP_C)}
          y2={y(RAW_MILK_MAX_TEMP_C)}
          stroke="#b42318"
          strokeDasharray="5 4"
        />
        <text
          x={W - PAD.right}
          y={y(RAW_MILK_MAX_TEMP_C) - 6}
          textAnchor="end"
          className="fill-[#b42318] text-[11px] font-semibold"
        >
          {t('limit')}
        </text>
        <path d={line} fill="none" stroke="#2065ae" strokeWidth={2.5} strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle
            key={p.at}
            cx={x(times[i]!)}
            cy={y(p.c)}
            r={3.5}
            fill={STAGE_COLOR[p.stage] ?? '#2065ae'}
            stroke="#fff"
            strokeWidth={1.5}
          >
            <title>{`${hour.format(times[i]!)} · ${p.c}℃ · ${t(`stage.${p.stage}`)}`}</title>
          </circle>
        ))}
        {ticks.map((ms) => (
          <text
            key={ms}
            x={x(ms)}
            y={H - 10}
            textAnchor="middle"
            className="fill-[#6b7280] text-[11px]"
          >
            {hour.format(ms)}
          </text>
        ))}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {Object.entries(STAGE_COLOR).map(([stage, color]) => (
          <span key={stage} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
            {t(`stage.${stage}`)}
          </span>
        ))}
        {maxAfter !== null && (
          <span className="ml-auto font-semibold text-[#2f8f4e]">
            {t('maxAfter', { max: maxAfter.toFixed(1) })}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
