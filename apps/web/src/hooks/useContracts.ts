import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Locale } from '@milcow/shared';
import {
  cancelContract,
  createContract,
  draftContract,
  getContracts,
  getServicePlans,
  submitContract,
  type CreateContractInput,
} from '@/services/contract.service';

export const contractKeys = {
  all: ['contracts'] as const,
  list: () => [...contractKeys.all, 'list'] as const,
  servicePlans: ['service-plans'] as const,
};

export function useContracts(enabled = true) {
  return useQuery({ queryKey: contractKeys.list(), queryFn: getContracts, enabled });
}

export function useServicePlans() {
  return useQuery({
    queryKey: contractKeys.servicePlans,
    queryFn: getServicePlans,
    staleTime: 10 * 60_000,
  });
}

/** AI draft — a mutation: the user triggers it, nothing is cached */
export function useContractDraft() {
  return useMutation({
    mutationFn: ({ request, locale }: { request: string; locale: Locale }) =>
      draftContract(request, locale),
  });
}

/** Save (and optionally submit for review) → refresh "my contracts" */
export function useCreateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ input, submit }: { input: CreateContractInput; submit: boolean }) => {
      const contract = await createContract(input);
      return submit ? submitContract(contract.id) : contract;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contractKeys.all }),
  });
}

export function useContractAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'submit' | 'cancel' }) =>
      action === 'submit' ? submitContract(id) : cancelContract(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contractKeys.all }),
  });
}
