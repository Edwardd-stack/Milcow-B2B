import { useQuery } from '@tanstack/react-query';
import { getProducts, type ProductListParams } from '@/services/product.service';

/** Query keys in one place — the params are part of the key, so each filter has its own cache */
export const productKeys = {
  all: ['products'] as const,
  list: (params: ProductListParams) => [...productKeys.all, 'list', params] as const,
};

export function useProducts(params: ProductListParams = {}) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => getProducts(params),
  });
}
