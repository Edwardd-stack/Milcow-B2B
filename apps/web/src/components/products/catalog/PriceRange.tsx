'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { formatKrw } from '@/lib/format';

const STEP = 100_000; // KRW

/**
 * Two-thumb price slider = two <input type="range"> on top of each other.
 * Moves freely while dragging; the filter is applied when the thumb is released.
 */
export function PriceRange({
  bounds,
  value,
  onCommit,
}: {
  bounds: [number, number];
  value: [number | undefined, number | undefined];
  onCommit: (min: number | undefined, max: number | undefined) => void;
}) {
  const t = useTranslations('Catalog');
  const locale = useLocale();
  const [lo, hi] = bounds;
  const [range, setRange] = useState<[number, number]>([value[0] ?? lo, value[1] ?? hi]);

  const commit = () =>
    // the full range means "no price filter" → keep the URL clean
    onCommit(range[0] > lo ? range[0] : undefined, range[1] < hi ? range[1] : undefined);

  const pct = (v: number) => ((v - lo) / (hi - lo || 1)) * 100;
  const thumb =
    'pointer-events-none absolute inset-x-0 top-1/2 h-1.5 w-full -translate-y-1/2 appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-brand [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-brand [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md';

  return (
    <div>
      <div className="relative mx-2 h-6">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-line" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand"
          style={{ left: `${pct(range[0])}%`, right: `${100 - pct(range[1])}%` }}
        />
        <input
          type="range"
          aria-label={t('priceMin')}
          min={lo}
          max={hi}
          step={STEP}
          value={range[0]}
          onChange={(e) => setRange([Math.min(Number(e.target.value), range[1] - STEP), range[1]])}
          onPointerUp={commit}
          onKeyUp={commit}
          className={thumb}
        />
        <input
          type="range"
          aria-label={t('priceMax')}
          min={lo}
          max={hi}
          step={STEP}
          value={range[1]}
          onChange={(e) => setRange([range[0], Math.max(Number(e.target.value), range[0] + STEP)])}
          onPointerUp={commit}
          onKeyUp={commit}
          className={thumb}
        />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-xs">
        <span className="rounded-lg bg-cream px-2.5 py-1.5 font-medium text-heading">
          {formatKrw(range[0], locale)}
        </span>
        <span className="text-soft">—</span>
        <span className="rounded-lg bg-cream px-2.5 py-1.5 font-medium text-heading">
          {formatKrw(range[1], locale)}
        </span>
      </div>
    </div>
  );
}
