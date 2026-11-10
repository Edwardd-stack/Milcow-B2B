import type {
  Paginated,
  ProductFacets,
  ProductGrade,
  ProductInfo,
  ProductSort,
  ProductType,
} from '@milcow/shared';
import { apiFetch } from '@/lib/api-client';

export interface ProductListParams {
  page?: number;
  limit?: number;
  productType?: ProductType;
  grades?: ProductGrade[];
  warehouseIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  q?: string;
  sort?: ProductSort;
}

/** GET /products — filters become a query string; empty values are left out, lists become "a,b" */
export function getProducts(params: ProductListParams = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '' || value === false) continue;
    if (Array.isArray(value)) {
      if (value.length) query.set(key, value.join(','));
    } else {
      query.set(key, String(value));
    }
  }
  const qs = query.toString();
  return apiFetch<Paginated<ProductInfo>>(`/products${qs ? `?${qs}` : ''}`);
}

/** GET /products/facets — counts per type + price range for the sidebar */
export function getProductFacets() {
  return apiFetch<ProductFacets>('/products/facets');
}
