import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Paginated, ProductFacets, ProductInfo } from '@milcow/shared';
import { ApiRequestError } from '@/lib/api-client';
import {
  getProduct,
  getProductFacets,
  getProductNeighbors,
  getProducts,
  type ProductListParams,
} from '@/services/product.service';

/** Query keys in one place — the params are part of the key, so each filter has its own cache */
export const productKeys = {
  all: ['products'] as const,
  list: (params: ProductListParams) => [...productKeys.all, 'list', params] as const,
  facets: () => [...productKeys.all, 'facets'] as const,
  detail: (id: string) => [...productKeys.all, 'detail', id] as const,
  neighbors: (id: string) => [...productKeys.all, 'neighbors', id] as const,
};

/**
 * Server snapshot for the first render (see lib/public-snapshot.ts).
 * React Query shows it at once and, because `updatedAt` is in the past, refetches in the background.
 */
export interface Initial<T> {
  data: T;
  updatedAt: number;
}

export function useProducts(
  params: ProductListParams = {},
  initial?: Initial<Paginated<ProductInfo>>,
) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => getProducts(params),
    // While the next page / filter loads, keep showing the current cards (no empty flash)
    placeholderData: keepPreviousData,
    initialData: initial?.data,
    initialDataUpdatedAt: initial?.updatedAt,
  });
}

export function useProductFacets(initial?: Initial<ProductFacets>) {
  return useQuery({
    queryKey: productKeys.facets(),
    queryFn: getProductFacets,
    staleTime: 10 * 60_000,
    initialData: initial?.data,
    initialDataUpdatedAt: initial?.updatedAt,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => getProduct(id),
    // "not found" / bad id will not fix itself → don't retry those
    retry: (count, error) => !(error instanceof ApiRequestError && error.status < 500) && count < 1,
  });
}

export function useProductNeighbors(id: string) {
  return useQuery({
    queryKey: productKeys.neighbors(id),
    queryFn: () => getProductNeighbors(id),
    staleTime: 5 * 60_000,
    retry: false,
  });
}
