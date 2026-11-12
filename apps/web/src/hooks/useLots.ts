import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiRequestError } from '@/lib/api-client';
import {
  getFeaturedLots,
  getPassport,
  getSurplus,
  reserveSurplus,
  type SurplusParams,
} from '@/services/lot.service';
import { orderKeys } from './useOrders';

export const lotKeys = {
  featured: ['lots', 'featured'] as const,
  passport: (code: string) => ['lots', 'passport', code] as const,
  surplus: (params: SurplusParams) => ['surplus', params] as const,
};

export function useFeaturedLots() {
  return useQuery({ queryKey: lotKeys.featured, queryFn: getFeaturedLots, staleTime: 60_000 });
}

export function usePassport(code: string) {
  return useQuery({
    queryKey: lotKeys.passport(code),
    queryFn: () => getPassport(code),
    enabled: !!code,
    // A wrong code is a normal answer (404), not something to retry
    retry: (count, error) =>
      !(error instanceof ApiRequestError && error.status === 404) && count < 2,
  });
}

/** Prices change every 6 hours and other buyers take tons → refresh every 30 s */
export function useSurplus(params: SurplusParams) {
  return useQuery({
    queryKey: lotKeys.surplus(params),
    queryFn: () => getSurplus(params),
    refetchInterval: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useReserveSurplus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lotId, ton }: { lotId: string; ton: number }) => reserveSurplus(lotId, ton),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surplus'] });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

/** "ML-20261113-ICN-07" from anything the user typed or scanned (a full passport URL works too) */
export function extractLotCode(text: string): string | null {
  return text.toUpperCase().match(/ML-\d{8}-[A-Z]{3}-\d{2}/)?.[0] ?? null;
}
