'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useProductFacets, useProducts } from '@/hooks/useProducts';
import { useWarehouses } from '@/hooks/useLocations';
import { ProductCard, ProductCardSkeleton } from '../ProductCard';
import { FilterSidebar } from './FilterSidebar';
import { Pagination } from './Pagination';
import { ProductTable } from './ProductTable';
import { SortSelect } from './SortSelect';
import { useCatalogParams } from './useCatalogParams';
import { ViewToggle } from './ViewToggle';

/** sessionStorage key: the catalog's last query string ("?type=BUTTER&page=2") */
export const CATALOG_QS_KEY = 'milcow:catalog-qs';

// Cards are tall → 6 per page; table rows are short → 10
const PAGE_SIZE = { card: 6, table: 10 } as const;

/** /products: filters on the left (in the URL), cards or table on the right, pagination below */
export function ProductCatalog() {
  const t = useTranslations('Catalog');
  const { state, update, activeCount } = useCatalogParams();
  const [filtersOpen, setFiltersOpen] = useState(false); // phones: the sidebar folds away

  // Search box: typed text updates the URL 350 ms after the last key (not on every key)
  const [search, setSearch] = useState(state.q);
  useEffect(() => {
    const id = setTimeout(() => {
      if (search.trim() !== state.q) update({ q: search.trim() });
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the typed text should trigger this
  }, [search]);

  const { data, isPending, isError, isPlaceholderData } = useProducts({
    page: state.page,
    limit: PAGE_SIZE[state.view],
    productType: state.type,
    grades: state.grades,
    warehouseIds: state.warehouses,
    minPrice: state.min,
    maxPrice: state.max,
    inStock: state.inStock,
    q: state.q || undefined,
    sort: state.sort,
  });
  // Remember the current filters / page → the detail page's "back" arrow returns to exactly this list
  useEffect(() => {
    try {
      // Only while the catalog is the page on screen (Next may keep it mounted in the background)
      if (/\/products\/?$/.test(window.location.pathname)) {
        sessionStorage.setItem(CATALOG_QS_KEY, window.location.search);
      }
    } catch {
      // storage can be blocked (private mode) — the back arrow then opens the plain catalog
    }
  });

  const { data: facets } = useProductFacets();
  const { data: warehouses } = useWarehouses();

  const reset = () => {
    setSearch('');
    update({
      type: undefined,
      grades: [],
      warehouses: [],
      min: undefined,
      max: undefined,
      inStock: false,
      q: '',
      sort: 'RECOMMENDED',
    });
  };

  // The page stays where it is (no jump to the top) — only the cards change
  const goToPage = (page: number) => update({ page });

  const meta = data?.meta;
  const from = meta && meta.total ? (meta.page - 1) * meta.limit + 1 : 0;
  const to = meta ? Math.min(meta.page * meta.limit, meta.total) : 0;

  return (
    // ≥1600px: lifted a little more, but only as far as the cream part of the wave reaches at the
    // right edge of the container (≈3.2vw) — the right corner must not climb onto the blue
    <div className="relative -mt-16 grid gap-7 min-[100rem]:-mt-[max(4rem,calc(3.2vw+0.5rem))] pb-22 lg:pt-3 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* ── Sidebar ── */}
      <aside className="self-start rounded-3xl bg-white p-6 shadow-[0_20px_50px_rgba(17,55,95,0.1)] lg:sticky lg:top-6">
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          className="flex w-full items-center justify-between font-semibold text-heading lg:hidden"
        >
          {t('filters')}{' '}
          {activeCount > 0 && (
            <span className="rounded-full bg-brand px-2 py-0.5 text-xs text-white">
              {activeCount}
            </span>
          )}
          <svg
            viewBox="0 0 24 24"
            className={`h-5 w-5 transition ${filtersOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <div className={`${filtersOpen ? 'mt-6 block' : 'hidden'} lg:mt-0 lg:block`}>
          <FilterSidebar
            state={state}
            update={update}
            search={search}
            onSearch={setSearch}
            facets={facets}
            warehouses={warehouses}
            activeCount={activeCount}
            onReset={reset}
          />
        </div>
      </aside>

      {/* ── Results ── */}
      <div className="min-w-0">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-5 py-3 shadow-[0_10px_30px_rgba(17,55,95,0.06)]">
          <p className="text-[15px] text-muted" aria-live="polite">
            {meta
              ? t.rich('count', {
                  total: meta.total,
                  from,
                  to,
                  b: (c) => <b className="text-heading">{c}</b>,
                })
              : '…'}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <SortSelect value={state.sort} onChange={(sort) => update({ sort })} />
            {/* page size differs per view → start again at page 1 */}
            <ViewToggle view={state.view} onChange={(view) => update({ view })} />
          </div>
        </div>

        <div className={`transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}>
          {isError ? (
            <p className="rounded-2xl bg-white py-16 text-center text-muted">{t('error')}</p>
          ) : isPending ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: PAGE_SIZE.card }, (_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : data.list.length === 0 ? (
            <div className="rounded-2xl bg-white px-6 py-16 text-center">
              <p className="text-lg font-semibold text-heading">{t('empty.title')}</p>
              <p className="mt-2 text-muted">{t('empty.text')}</p>
              <button
                type="button"
                onClick={reset}
                className="mt-6 rounded-full bg-brand px-7 py-3 text-sm font-semibold text-white transition hover:bg-navy"
              >
                {t('reset')}
              </button>
            </div>
          ) : state.view === 'table' ? (
            <ProductTable products={data.list} />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {data.list.map((product) => (
                <ProductCard key={product.id} product={product} compact />
              ))}
            </div>
          )}
        </div>

        {meta && (
          <div className="mt-12">
            <Pagination page={meta.page} totalPages={meta.totalPages} onChange={goToPage} />
          </div>
        )}
      </div>
    </div>
  );
}
