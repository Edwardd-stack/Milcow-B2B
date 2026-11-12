'use client';

import { useSearchParams } from 'next/navigation';
import {
  ProductGrade,
  ProductSort,
  ProductType,
  type ProductGrade as Grade,
  type ProductSort as Sort,
  type ProductType as Type,
} from '@milcow/shared';
import { usePathname, useRouter } from '@/i18n/navigation';

export type CatalogView = 'card' | 'table';

export interface CatalogState {
  type?: Type;
  grades: Grade[];
  warehouses: string[];
  min?: number;
  max?: number;
  inStock: boolean;
  q: string;
  sort: Sort;
  page: number;
  view: CatalogView;
}

const list = (value: string | null) => (value ? value.split(',').filter(Boolean) : []);
const num = (value: string | null) => (value && /^\d+$/.test(value) ? Number(value) : undefined);
const oneOf = <T extends string>(value: string | null, allowed: readonly T[]) =>
  allowed.includes(value as T) ? (value as T) : undefined;

/**
 * Filters live in the URL (?type=BUTTER&grades=PREMIUM&page=2&view=table):
 * a link can be shared, refresh keeps the state, the back button undoes a filter.
 */
export function useCatalogParams() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const state: CatalogState = {
    type: oneOf(params.get('type'), Object.values(ProductType)),
    grades: list(params.get('grades')).filter((g): g is Grade =>
      (Object.values(ProductGrade) as string[]).includes(g),
    ),
    warehouses: list(params.get('warehouses')),
    min: num(params.get('min')),
    max: num(params.get('max')),
    inStock: params.get('inStock') === '1',
    q: params.get('q') ?? '',
    sort: oneOf(params.get('sort'), Object.values(ProductSort)) ?? 'RECOMMENDED',
    page: Math.max(1, num(params.get('page')) ?? 1),
    view: params.get('view') === 'table' ? 'table' : 'card', // cards by default
  };

  /** Any filter change → back to page 1 (unless the page itself is what changed) */
  const update = (patch: Partial<CatalogState>) => {
    const next = { ...state, page: 1, ...patch };
    const query = new URLSearchParams();
    if (next.type) query.set('type', next.type);
    if (next.grades.length) query.set('grades', next.grades.join(','));
    if (next.warehouses.length) query.set('warehouses', next.warehouses.join(','));
    if (next.min !== undefined) query.set('min', String(next.min));
    if (next.max !== undefined) query.set('max', String(next.max));
    if (next.inStock) query.set('inStock', '1');
    if (next.q) query.set('q', next.q);
    if (next.sort !== 'RECOMMENDED') query.set('sort', next.sort);
    if (next.page > 1) query.set('page', String(next.page));
    if (next.view === 'table') query.set('view', 'table');
    const qs = query.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const activeCount =
    (state.type ? 1 : 0) +
    state.grades.length +
    state.warehouses.length +
    (state.min !== undefined || state.max !== undefined ? 1 : 0) +
    (state.inStock ? 1 : 0) +
    (state.q ? 1 : 0);

  return { state, update, activeCount };
}
