import { keepPreviousData, useQuery } from '@tanstack/react-query';
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

export function useProducts(params: ProductListParams = {}) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => getProducts(params),
    // While the next page / filter loads, keep showing the current cards (no empty flash)
    placeholderData: keepPreviousData,
  });
}

export function useProductFacets() {
  return useQuery({
    queryKey: productKeys.facets(),
    queryFn: getProductFacets,
    staleTime: 10 * 60_000,
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
