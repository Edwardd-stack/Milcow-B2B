import type {
  FarmInfo,
  Paginated,
  ProductFacets,
  ProductInfo,
  WarehouseInfo,
} from '@milcow/shared';
import type { Initial } from '@/hooks/useProducts';

/** Every product fits in one request (the catalog is small) — must match SNAPSHOT_LIMIT users */
export const SNAPSHOT_LIMIT = 50;

/**
 * Public catalog data, rendered into the HTML on the server.
 * Why: the free API host sleeps when idle and needs ~1 min to wake. With this snapshot the
 * products are on screen at once; the browser then refreshes them from the API in the background.
 */
export interface PublicSnapshot {
  products: Paginated<ProductInfo>; // sort=RECOMMENDED, limit=SNAPSHOT_LIMIT
  facets: ProductFacets;
  warehouses: WarehouseInfo[];
  farms: FarmInfo[];
  fetchedAt: number; // ms — React Query treats the snapshot as old and refetches in the background
}

/** Snapshot part → React Query `initial` (undefined when there is no snapshot) */
export function initialOf<K extends 'facets' | 'warehouses' | 'farms' | 'products'>(
  snapshot: PublicSnapshot | null | undefined,
  key: K,
): Initial<PublicSnapshot[K]> | undefined {
  return snapshot ? { data: snapshot[key], updatedAt: snapshot.fetchedAt } : undefined;
}

/**
 * One catalog page cut out of the snapshot (it holds every product in RECOMMENDED order).
 * Only valid for the unfiltered default list — any filter or other sort goes to the API.
 */
export function snapshotPage(
  snapshot: PublicSnapshot | null | undefined,
  page: number,
  limit: number,
): Initial<Paginated<ProductInfo>> | undefined {
  if (!snapshot) return undefined;
  const all = snapshot.products;
  if (all.meta.total > all.list.length) return undefined; // snapshot is incomplete → can't page it
  const total = all.list.length;
  return {
    data: {
      list: all.list.slice((page - 1) * limit, page * limit),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    },
    updatedAt: snapshot.fetchedAt,
  };
}
