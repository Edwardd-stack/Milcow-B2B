'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ProductGrade, ProductType, type ProductFacets, type WarehouseInfo } from '@milcow/shared';
import { PriceRange } from './PriceRange';
import type { CatalogState } from './useCatalogParams';

const TYPES = Object.values(ProductType);
const GRADES = Object.values(ProductGrade);

interface Props {
  state: CatalogState;
  update: (patch: Partial<CatalogState>) => void;
  search: string;
  onSearch: (value: string) => void;
  facets?: ProductFacets;
  warehouses?: WarehouseInfo[];
  activeCount: number;
  onReset: () => void;
}

/** Left column of /products: search, category, grade, price, warehouse, stock */
export function FilterSidebar({
  state,
  update,
  search,
  onSearch,
  facets,
  warehouses,
  activeCount,
  onReset,
}: Props) {
  const t = useTranslations('Catalog');
  const tp = useTranslations('Product');
  const locale = useLocale() as 'ko' | 'en' | 'uz';

  const toggle = <T extends string>(list: T[], item: T) =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

  return (
    <div className="space-y-7">
      {/* Search */}
      <label className="flex h-12 items-center gap-2.5 rounded-full border border-line bg-white px-4 transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/12">
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 shrink-0 text-soft"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span className="sr-only">{t('search')}</span>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={t('search')}
          maxLength={50}
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-soft"
        />
      </label>

      {/* Category */}
      <Section title={t('category')}>
        <ul className="space-y-1">
          {[undefined, ...TYPES].map((type) => {
            const active = state.type === type;
            const count = type ? facets?.byType[type] : facets?.total;
            return (
              <li key={type ?? 'all'}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => update({ type })}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-[15px] transition ${
                    active
                      ? 'bg-brand font-semibold text-white shadow-[0_8px_18px_rgba(32,101,174,0.25)]'
                      : 'text-ink hover:bg-cream hover:text-brand'
                  }`}
                >
                  {type ? tp(`type.${type}`) : t('all')}
                  <span
                    className={`min-w-7 rounded-full px-2 py-0.5 text-center text-xs ${active ? 'bg-white/20' : 'bg-cream text-muted'}`}
                  >
                    {count ?? '·'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* Grade */}
      <Section title={t('grade')}>
        <div className="space-y-1">
          {GRADES.map((grade) => (
            <Check
              key={grade}
              checked={state.grades.includes(grade)}
              onChange={() => update({ grades: toggle(state.grades, grade) })}
              label={tp(`grade.${grade}`)}
            />
          ))}
        </div>
      </Section>

      {/* Price */}
      {facets && facets.priceMax > facets.priceMin && (
        <Section title={t('price')}>
          <PriceRange
            // remount when the URL changes from outside (e.g. "reset filters")
            key={`${state.min ?? ''}-${state.max ?? ''}`}
            bounds={[facets.priceMin, facets.priceMax]}
            value={[state.min, state.max]}
            onCommit={(min, max) => update({ min, max })}
          />
        </Section>
      )}

      {/* Warehouse */}
      <Section title={t('warehouse')}>
        <div className="space-y-1">
          {warehouses?.map((w) => (
            <Check
              key={w.id}
              checked={state.warehouses.includes(w.id)}
              onChange={() => update({ warehouses: toggle(state.warehouses, w.id) })}
              label={w.warehouseName[locale].replace(/^Milcow\s*/, '')}
              hint={w.warehouseTempC !== null ? `${w.warehouseTempC}°C` : undefined}
            />
          ))}
        </div>
      </Section>

      {/* In stock */}
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-cream px-4 py-3.5 text-[15px] font-medium text-heading">
        {t('inStockOnly')}
        <span className="relative">
          <input
            type="checkbox"
            checked={state.inStock}
            onChange={(e) => update({ inStock: e.target.checked })}
            className="peer sr-only"
          />
          <span className="block h-6 w-11 rounded-full bg-line transition peer-checked:bg-brand peer-focus-visible:ring-4 peer-focus-visible:ring-brand/20" />
          <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
        </span>
      </label>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={onReset}
          className="w-full rounded-full border border-brand/30 py-3 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
        >
          {t('reset')} ({activeCount})
        </button>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold tracking-[0.15em] text-brand uppercase">{title}</h3>
      {children}
    </section>
  );
}

function Check({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2 text-[15px] text-ink transition hover:bg-cream">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 border-line bg-white transition peer-checked:border-brand peer-checked:bg-brand peer-focus-visible:ring-4 peer-focus-visible:ring-brand/20">
        <svg
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 text-white ${checked ? '' : 'invisible'}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m5 12 5 5 9-10" />
        </svg>
      </span>
      <span className="flex-1">{label}</span>
      {hint && <span className="text-xs text-soft">{hint}</span>}
    </label>
  );
}
