import { useQuery } from '@tanstack/react-query';
import { getFarms, getWarehouses } from '@/services/location.service';

export const locationKeys = {
  farms: ['farms'] as const,
  warehouses: ['warehouses'] as const,
};

/** Farms and warehouses change rarely → keep them fresh for 10 minutes */
export function useFarms() {
  return useQuery({ queryKey: locationKeys.farms, queryFn: getFarms, staleTime: 10 * 60_000 });
}

export function useWarehouses() {
  return useQuery({
    queryKey: locationKeys.warehouses,
    queryFn: getWarehouses,
    staleTime: 10 * 60_000,
  });
}
