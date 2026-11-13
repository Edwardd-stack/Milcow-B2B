'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import type { AdminStats } from '@milcow/shared';
import { formatKrw } from '@/lib/format';

/** 14-day revenue bars (plain SVG — no chart library for one small chart) */
export function RevenueChart({ daily }: { daily: AdminStats['daily'] }) {
  const locale = useLocale();
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...daily.map((d) => d.revenue));
  const W = 560;
  const H = 180;
  const gap = 8;
  const barW = (W - gap * (daily.length - 1)) / daily.length;
  const shown = hover ?? daily.length - 1;
  const current = daily[shown];

  return (
    <div>
      <p className="text-sm text-muted">
        {current?.date.slice(5).replace('-', '/')} ·{' '}
        <b className="text-heading">{formatKrw(current?.revenue ?? 0, locale)}</b>
      </p>
      <svg
        viewBox={`0 0 ${W} ${H + 22}`}
        className="mt-3 w-full"
        role="img"
        aria-label="14-day revenue"
        onMouseLeave={() => setHover(null)}
      >
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={0} x2={W} y1={H - H * f} y2={H - H * f} stroke="#eef1f5" />
        ))}
        {daily.map((d, i) => {
          const h = d.revenue > 0 ? Math.max(4, (d.revenue / max) * (H - 8)) : 2;
          const x = i * (barW + gap);
          const isActive = i === shown;
          return (
            <g key={d.date} onMouseEnter={() => setHover(i)}>
              <rect x={x} y={0} width={barW} height={H} fill="transparent" />
              <rect
                x={x}
                y={H - h}
                width={barW}
                height={h}
                rx={4}
                fill={isActive ? '#2065ae' : d.revenue > 0 ? '#9cc0e8' : '#e5e7eb'}
              />
              {(i % 2 === 1 || i === daily.length - 1) && (
                <text
                  x={x + barW / 2}
                  y={H + 16}
                  textAnchor="middle"
                  fontSize="11"
                  fill={isActive ? '#1b2a47' : '#9b9b9b'}
                >
                  {d.date.slice(8)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
