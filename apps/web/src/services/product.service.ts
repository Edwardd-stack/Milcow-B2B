import type { Paginated, ProductInfo, ProductSort, ProductType } from '@milcow/shared';
import { apiFetch } from '@/lib/api-client';

export interface ProductListParams {
  page?: number;
  limit?: number;
  productType?: ProductType;
  sort?: ProductSort;
}

/** GET /products — filters become a query string, empty values are left out */
export function getProducts(params: ProductListParams = {}) {
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)]),
  ).toString();
  return apiFetch<Paginated<ProductInfo>>(`/products${query ? `?${query}` : ''}`);
}
