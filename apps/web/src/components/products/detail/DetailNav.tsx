'use client';

import { useTranslations } from 'next-intl';
import { useProductNeighbors } from '@/hooks/useProducts';
import { Link, useRouter } from '@/i18n/navigation';
import { CATALOG_QS_KEY } from '../catalog/ProductCatalog';

const Chevron = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg
    viewBox="0 0 24 24"
    className="h-[18px] w-[18px]"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={dir === 'left' ? 'm15 6-6 6 6 6' : 'm9 6 6 6-6 6'} />
  </svg>
);

/**
 * Row above the product: "← All products" on the left (back to the list, filters kept),
 * "3 / 20  ‹ ›" on the right (previous / next product without going back to the list).
 */
export function DetailNav({ productId }: { productId: string }) {
  const t = useTranslations('ProductDetail');
  const router = useRouter();
  const { data: neighbors } = useProductNeighbors(productId);

  // Return to the list as the visitor left it (?type=BUTTER&page=2), if we remember it
  const back = (e: React.MouseEvent<HTMLAnchorElement>) => {
    let qs = '';
    try {
      qs = sessionStorage.getItem(CATALOG_QS_KEY) ?? '';
    } catch {
      // storage blocked → plain catalog
    }
    if (!qs) return; // let the normal link work
    e.preventDefault();
    router.push(`/products${qs}`);
  };

  const round =
    'grid h-10 w-10 place-items-center rounded-full bg-white text-brand shadow-[0_8px_20px_rgba(17,55,95,0.12)] ring-1 ring-brand/10 transition';
  const arrow = (id: string | null | undefined, dir: 'left' | 'right', label: string) =>
    id ? (
      <Link
        href={`/products/${id}`}
        aria-label={label}
        title={label}
        className={`${round} hover:bg-brand hover:text-white`}
      >
        <Chevron dir={dir} />
      </Link>
    ) : (
      // first / last product (or still loading): visible but switched off
      <span
        aria-disabled="true"
        aria-label={label}
        className={`${round} cursor-not-allowed opacity-40`}
      >
        <Chevron dir={dir} />
      </span>
    );

  return (
    <nav aria-label={t('title')} className="flex items-center justify-between gap-3">
      <Link
        href="/products"
        onClick={back}
        className="group flex h-10 items-center gap-1.5 rounded-full bg-white pr-4 pl-2.5 text-[13px] font-semibold text-brand shadow-[0_8px_20px_rgba(17,55,95,0.12)] ring-1 ring-brand/10 transition hover:bg-brand hover:text-white"
      >
        <span className="transition group-hover:-translate-x-0.5">
          <Chevron dir="left" />
        </span>
        {t('backToList')}
      </Link>

      <div className="flex items-center gap-2">
        {neighbors && (
          <span className="mr-1 rounded-full bg-white/70 px-2.5 py-1 text-[13px] font-medium text-muted">
            <b className="text-heading">{neighbors.position}</b> / {neighbors.total}
          </span>
        )}
        {arrow(neighbors?.prevId, 'left', t('prev'))}
        {arrow(neighbors?.nextId, 'right', t('next'))}
      </div>
    </nav>
  );
}
