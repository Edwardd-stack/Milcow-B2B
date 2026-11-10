import type { FarmInfo, WarehouseInfo } from '@milcow/shared';
import { apiFetch } from '@/lib/api-client';

/** GET /farms (public) */
export function getFarms() {
  return apiFetch<FarmInfo[]>('/farms');
}

/** GET /warehouses (public) */
export function getWarehouses() {
  return apiFetch<WarehouseInfo[]>('/warehouses');
}
