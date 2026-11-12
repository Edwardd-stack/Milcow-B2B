'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { ProductDetail } from '@milcow/shared';
import { ArrowRightIcon, SparkIcon } from '@/components/icons';
import { Link } from '@/i18n/navigation';
import { formatKrw, formatTon } from '@/lib/format';

type Stock = ProductDetail['stock'][number];

/** Keeps the amount between min and max, rounded to 2 decimals (the API accepts 2) */
export function clampTon(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.round(Math.min(Math.max(value, min), Math.max(min, max)) * 100) / 100;
}

/** Sticky right column: price, quantity (− / input / +), estimated total, order + AI contract */
export function OrderPanel({
  product,
  warehouse,
  ton,
  onTon,
}: {
  product: ProductDetail;
  warehouse: Stock | undefined;
  ton: number;
  onTon: (ton: number) => void;
}) {
  const t = useTranslations('ProductDetail');
  const tp = useTranslations('Product');
  const locale = useLocale() as 'ko' | 'en' | 'uz';

  const min = product.productMinOrderTon;
  const max = warehouse?.inventoryTon ?? 0;
  const canOrder = !!warehouse && max >= min;
  const step = min < 1 ? 0.5 : 1;
  const round =
    'grid h-full w-[52px] shrink-0 place-items-center text-2xl text-brand transition hover:bg-cream disabled:pointer-events-none disabled:opacity-30';

  return (
    <aside className="self-start rounded-3xl bg-white p-6 shadow-[0_20px_50px_rgba(17,55,95,0.1)] sm:p-7 lg:sticky lg:top-6">
      <p className="text-sm text-muted">{t('pricePerTon')}</p>
      <p className="mt-1 text-[32px] leading-tight font-extrabold text-heading">
        {formatKrw(product.productPricePerTon, locale)}
      </p>

      {canOrder ? (
        <>
          <dl className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-cream px-4 py-3 text-sm">
            <dt className="text-muted">{t('warehouse')}</dt>
            <dd className="truncate font-semibold text-heading">
              {warehouse.warehouseName[locale].replace(/^Milcow\s*/, '')}
            </dd>
          </dl>

          <p className="mt-5 mb-2 text-sm font-semibold text-heading">{t('quantity')}</p>
          <div className="flex h-[52px] items-center overflow-hidden rounded-full border border-line focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/12">
            <button
              type="button"
              aria-label={t('decrease')}
              disabled={ton <= min}
              onClick={() => onTon(clampTon(ton - step, min, max))}
              className={round}
            >
              −
            </button>
            <label className="flex min-w-0 flex-1 items-center justify-center gap-1.5 font-bold text-heading">
              <span className="sr-only">{t('quantity')}</span>
              <input
                type="number"
                inputMode="decimal"
                min={min}
                max={max}
                step="0.01"
                value={ton}
                onChange={(e) => onTon(Number(e.target.value))}
                onBlur={() => onTon(clampTon(ton, min, max))}
                className="w-20 [appearance:textfield] bg-transparent text-right outline-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              {tp('ton')}
            </label>
            <button
              type="button"
              aria-label={t('increase')}
              disabled={ton >= max}
              onClick={() => onTon(clampTon(ton + step, min, max))}
              className={round}
            >
              +
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">
            {t('qtyHint', { min: formatTon(min), max: formatTon(max) })}
          </p>

          <div className="mt-5 flex items-baseline justify-between gap-3 border-t border-dashed border-line pt-4">
            <span className="text-sm text-muted">
              {t('estimated')} <span className="text-xs text-soft">({t('vat')})</span>
            </span>
            <span className="text-2xl font-extrabold text-heading" aria-live="polite">
              {formatKrw(Math.round(product.productPricePerTon * clampTon(ton, min, max)), locale)}
            </span>
          </div>

          <Link
            href={`/checkout?product=${product.id}&warehouse=${warehouse.warehouseId}&ton=${clampTon(ton, min, max)}`}
            className="mt-5 flex h-[54px] items-center justify-center gap-2 rounded-full bg-brand font-semibold text-white shadow-[0_12px_26px_rgba(32,101,174,0.3)] transition hover:bg-navy"
          >
            {t('order')}
            <ArrowRightIcon />
          </Link>
        </>
      ) : (
        <p className="mt-5 rounded-2xl bg-[#fff4e0] px-4 py-3 text-sm text-[#9a5b00]">
          {t('unavailable')}
        </p>
      )}

      <Link
        href={`/contracts?product=${product.id}`}
        className="mt-3 flex h-[54px] items-center justify-center gap-2 rounded-full bg-linear-135 from-brand to-navy font-semibold text-white transition hover:-translate-y-0.5"
      >
        <SparkIcon className="h-5 w-5" />
        {t('aiContract')}
      </Link>
    </aside>
  );
}
