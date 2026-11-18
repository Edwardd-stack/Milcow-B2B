import { useQuery } from '@tanstack/react-query';
import type { FarmInfo, WarehouseInfo } from '@milcow/shared';
import { getFarms, getWarehouses } from '@/services/location.service';
import type { Initial } from './useProducts';

export const locationKeys = {
  farms: ['farms'] as const,
  warehouses: ['warehouses'] as const,
};

/** Farms and warehouses change rarely → keep them fresh for 10 minutes */
export function useFarms(initial?: Initial<FarmInfo[]>) {
  return useQuery({
    queryKey: locationKeys.farms,
    queryFn: getFarms,
    staleTime: 10 * 60_000,
    initialData: initial?.data,
    initialDataUpdatedAt: initial?.updatedAt,
  });
}

export function useWarehouses(initial?: Initial<WarehouseInfo[]>) {
  return useQuery({
    queryKey: locationKeys.warehouses,
    queryFn: getWarehouses,
    staleTime: 10 * 60_000,
    initialData: initial?.data,
    initialDataUpdatedAt: initial?.updatedAt,
  });
}
