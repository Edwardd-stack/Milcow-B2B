'use client';

import { useTranslations } from 'next-intl';
import type { ProductGrade, ProductInfo, ProductType } from '@milcow/shared';
import { ArrowRightIcon } from '@/components/icons';
import { ProductCard, ProductCardSkeleton } from '@/components/products/ProductCard';
import { Container } from '@/components/ui/Container';
import { useProducts } from '@/hooks/useProducts';
import { Link } from '@/i18n/navigation';

const FEATURED_COUNT = 6;

/** Raw milk first, then what is made from it */
const TYPE_ORDER: ProductType[] = [
  'RAW_MILK',
  'CREAM',
  'BUTTER',
  'CHEESE',
  'YOGURT',
  'MILK_POWDER',
];
const GRADE_RANK: Record<ProductGrade, number> = { PREMIUM: 0, GRADE_1: 1, GRADE_2: 2 };

/**
 * One product per type, in TYPE_ORDER — the best grade of each type
 * (premium → grade 1 → grade 2). Live data from the API.
 */
function pickFeatured(products: ProductInfo[]): ProductInfo[] {
  const best = new Map<ProductType, ProductInfo>();
  for (const product of products) {
    const current = best.get(product.productType);
    if (!current || GRADE_RANK[product.productGrade] < GRADE_RANK[current.productGrade]) {
      best.set(product.productType, product);
    }
  }
  return TYPE_ORDER.flatMap((type) => best.get(type) ?? []).slice(0, FEATURED_COUNT);
}

export function FeaturedProducts() {
  const t = useTranslations('Featured');
  const { data, isPending, isError } = useProducts({ limit: 50 });

  return (
    <section className="pt-2 pb-18 lg:pb-20">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="mb-3 text-base font-semibold tracking-[0.2em] text-brand uppercase">
              {t('eyebrow')}
            </p>
            <h2 className="text-[clamp(1.875rem,4.5vw,2.75rem)] leading-[1.15] font-extrabold text-navy uppercase">
              {t('title')}
            </h2>
            <p className="mt-4 font-light text-muted">{t('text')}</p>
          </div>
          <Link
            href="/products"
            className="group inline-flex shrink-0 items-center gap-3 rounded-full bg-brand py-2 pr-2 pl-7 font-medium text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark"
          >
            {t('viewAll')}
            {/* Round white badge with the arrow — slides right on hover */}
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand transition group-hover:translate-x-1">
              <ArrowRightIcon />
            </span>
          </Link>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {isPending &&
            Array.from({ length: FEATURED_COUNT }, (_, i) => <ProductCardSkeleton key={i} />)}
          {data && pickFeatured(data.list).map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        {isError && <p className="mt-6 text-center text-muted">{t('error')}</p>}
      </Container>
    </section>
  );
}
