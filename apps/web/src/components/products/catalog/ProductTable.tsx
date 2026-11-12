'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { ProductInfo } from '@milcow/shared';
import { Link } from '@/i18n/navigation';
import { formatKrw, formatTon } from '@/lib/format';
import { GRADE_STYLE } from '../ProductCard';
import { ProductIllustration } from '../ProductIllustration';

const COLS = 'lg:grid-cols-[minmax(0,2.6fr)_0.9fr_1.1fr_1.3fr_0.9fr_1.3fr_auto]';

/** Wholesale price list: one row per product, easy to compare side by side */
export function ProductTable({ products }: { products: ProductInfo[] }) {
  const t = useTranslations('Product');
  const tc = useTranslations('Catalog.table');
  const locale = useLocale() as 'ko' | 'en' | 'uz';
  const maxStock = Math.max(1, ...products.map((p) => p.totalStockTon));

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(17,55,95,0.06)]">
      {/* Header row (wide screens only; on phones every row labels its own values) */}
      <div
        className={`hidden gap-4 bg-[#f7f9fc] px-6 py-3.5 text-xs font-semibold tracking-wide text-muted lg:grid ${COLS}`}
      >
        <span>{tc('product')}</span>
        <span>{tc('grade')}</span>
        <span>{t('fatProtein')}</span>
        <span>{tc('price')}</span>
        <span>{t('minOrder')}</span>
        <span>{t('inStock')}</span>
        <span className="w-[92px]" />
      </div>

      <ul>
        {products.map((p) => (
          <li
            key={p.id}
            className={`grid grid-cols-2 items-center gap-x-4 gap-y-3 border-t border-line px-5 py-4 transition first:border-t-0 hover:bg-[#fafcff] lg:gap-4 lg:px-6 lg:first:border-t ${COLS}`}
          >
            <div className="col-span-2 flex items-center gap-3.5 lg:col-span-1">
              <ProductIllustration type={p.productType} className="h-12 w-12 shrink-0" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-heading" title={p.productName[locale]}>
                  {p.productName[locale]}
                </p>
                <p className="truncate text-xs text-muted">
                  {t(`type.${p.productType}`)} · {p.farm?.farmName[locale] ?? t('noFarm')}
                </p>
              </div>
            </div>
            <Cell label={tc('grade')}>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${GRADE_STYLE[p.productGrade]}`}
              >
                {t(`grade.${p.productGrade}`)}
              </span>
            </Cell>
            <Cell label={t('fatProtein')}>
              {p.productFatPct !== null && p.productProteinPct !== null
                ? `${p.productFatPct}% / ${p.productProteinPct}%`
                : '—'}
            </Cell>
            <Cell label={tc('price')}>
              <span className="font-bold text-heading">
                {formatKrw(p.productPricePerTon, locale)}
              </span>
            </Cell>
            <Cell label={t('minOrder')}>
              {formatTon(p.productMinOrderTon)} {t('ton')}
            </Cell>
            <Cell label={t('inStock')}>
              <span className="block w-full">
                {formatTon(p.totalStockTon)} {t('ton')}
                <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-line">
                  <span
                    className="block h-full rounded-full bg-brand"
                    style={{ width: `${(p.totalStockTon / maxStock) * 100}%` }}
                  />
                </span>
              </span>
            </Cell>
            <Link
              href={`/products/${p.id}`}
              className="col-span-2 justify-self-stretch rounded-full border border-brand px-4 py-2 text-center text-sm font-semibold text-brand transition hover:bg-brand hover:text-white lg:col-span-1 lg:w-[92px]"
            >
              {t('details')}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** On phones a cell shows its label above the value */
function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="text-sm text-ink">
      <span className="mb-1 block text-xs text-muted lg:hidden">{label}</span>
      {children}
    </div>
  );
}
