import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getProductFacets, getProducts, type ProductListParams } from '@/services/product.service';

/** Query keys in one place — the params are part of the key, so each filter has its own cache */
export const productKeys = {
  all: ['products'] as const,
  list: (params: ProductListParams) => [...productKeys.all, 'list', params] as const,
  facets: () => [...productKeys.all, 'facets'] as const,
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
