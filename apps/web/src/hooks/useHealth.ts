import { useQuery } from '@tanstack/react-query';
import { getHealth } from '@/services/health.service';

/** Query keys in one place — used for caching and invalidation. */
export const healthKeys = {
  all: ['health'] as const,
};

export function useHealth() {
  return useQuery({
    queryKey: healthKeys.all,
    queryFn: getHealth,
    refetchInterval: 30_000, // re-check the API every 30 seconds
  });
}
