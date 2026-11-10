import { useLocale, useTranslations } from 'next-intl';
import type { ProductInfo } from '@milcow/shared';
import { ArrowRightIcon } from '@/components/icons';
import { Link } from '@/i18n/navigation';
import { formatKrw, formatTon } from '@/lib/format';
import { ProductIllustration } from './ProductIllustration';

const GRADE_STYLE: Record<ProductInfo['productGrade'], string> = {
  PREMIUM: 'bg-accent/15 text-[#b86e00]',
  GRADE_1: 'bg-brand/10 text-brand',
  GRADE_2: 'bg-[#eef1f5] text-muted',
};

/** One product as a "pricing card" (template style). Reused on the home page and /products. */
export function ProductCard({ product }: { product: ProductInfo }) {
  const t = useTranslations('Product');
  const locale = useLocale() as 'ko' | 'en' | 'uz';

  const specs = [
    { label: t('minOrder'), value: `${formatTon(product.productMinOrderTon)} ${t('ton')}` },
    {
      label: t('fatProtein'),
      value:
        product.productFatPct !== null && product.productProteinPct !== null
          ? `${product.productFatPct}% / ${product.productProteinPct}%`
          : '—',
    },
    { label: t('inStock'), value: `${formatTon(product.totalStockTon)} ${t('ton')}` },
    { label: t('farm'), value: product.farm?.farmName[locale] ?? t('noFarm') },
  ];

  return (
    <article className="group flex flex-col rounded-2xl border border-white bg-white p-7 shadow-[0_10px_30px_rgba(17,55,95,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(17,55,95,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <ProductIllustration type={product.productType} className="h-[72px] w-[72px]" />
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${GRADE_STYLE[product.productGrade]}`}
        >
          {t(`grade.${product.productGrade}`)}
        </span>
      </div>

      <p className="mt-5 text-xs font-semibold tracking-[0.15em] text-brand uppercase">
        {t(`type.${product.productType}`)}
      </p>
      <h3
        // Always reserve 2 lines (longer names end with "…") → prices and specs line up across cards
        className="mt-1.5 line-clamp-2 min-h-[2lh] text-lg leading-snug font-semibold text-heading"
        title={product.productName[locale]}
      >
        {product.productName[locale]}
      </h3>

      <p className="mt-4 flex items-baseline gap-1.5">
        <span className="text-[28px] font-bold text-heading">
          {formatKrw(product.productPricePerTon, locale)}
        </span>
        <span className="text-sm text-muted">/ {t('ton')}</span>
      </p>

      <dl className="mt-5 mb-7 space-y-2.5 border-t border-line pt-5 text-sm">
        {specs.map((spec) => (
          <div key={spec.label} className="flex justify-between gap-4">
            <dt className="text-muted">{spec.label}</dt>
            <dd className="text-right font-medium text-ink">{spec.value}</dd>
          </div>
        ))}
      </dl>

      <Link
        href={`/products/${product.id}`}
        className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-brand-dark px-6 py-3 text-sm font-medium text-white transition group-hover:bg-navy"
      >
        {t('details')}
        <ArrowRightIcon />
      </Link>
    </article>
  );
}

/** Grey placeholder with the same size while data loads (no layout jump) */
export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-white p-7 shadow-[0_10px_30px_rgba(17,55,95,0.06)]">
      <div className="h-[72px] w-[72px] rounded-2xl bg-line" />
      <div className="mt-5 h-3 w-20 rounded bg-line" />
      <div className="mt-3 h-5 w-3/4 rounded bg-line" />
      <div className="mt-5 h-8 w-1/2 rounded bg-line" />
      <div className="mt-6 space-y-3 border-t border-line pt-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-3.5 rounded bg-line" />
        ))}
      </div>
      <div className="mt-7 h-11 rounded-full bg-line" />
    </div>
  );
}
