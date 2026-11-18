import { cacheLife } from 'next/cache';
import type {
  FarmInfo,
  Paginated,
  ProductFacets,
  ProductInfo,
  WarehouseInfo,
} from '@milcow/shared';
import { apiFetch } from '@/lib/api-client';
import { SNAPSHOT_LIMIT, type PublicSnapshot } from './snapshot-initial';

// Server only (uses the server cache). Client components import types/constants from ./snapshot-initial.
export type { PublicSnapshot };

const TIMEOUT_MS = 5_000; // a sleeping API must not hold the build / regeneration for minutes

/**
 * Cached on the server (stale-while-revalidate):
 *  - a visitor always gets the last good copy instantly,
 *  - after 5 min the next visit triggers a refresh in the background,
 *  - if the API is asleep the refresh throws → nothing is cached and the old copy stays in use.
 */
async function loadSnapshot(): Promise<PublicSnapshot> {
  'use cache';
  cacheLife({ stale: 60, revalidate: 300, expire: 7 * 24 * 3600 });

  const get = <T>(path: string) => apiFetch<T>(path, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  const [products, facets, warehouses, farms] = await Promise.all([
    get<Paginated<ProductInfo>>(`/products?limit=${SNAPSHOT_LIMIT}&sort=RECOMMENDED`),
    get<ProductFacets>('/products/facets'),
    get<WarehouseInfo[]>('/warehouses'),
    get<FarmInfo[]>('/farms'),
  ]);
  return { products, facets, warehouses, farms, fetchedAt: Date.now() };
}

/** null when the API could not be reached and there is no cached copy yet → pages fetch as before */
export async function getPublicSnapshot(): Promise<PublicSnapshot | null> {
  try {
    return await loadSnapshot();
  } catch (error) {
    console.warn('[snapshot] API not reachable:', error instanceof Error ? error.message : error);
    return null;
  }
}
