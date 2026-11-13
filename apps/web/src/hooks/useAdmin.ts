import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ContractStatus,
  InquiryStatus,
  OrderStatus,
  PickupStatus,
  ProductAdminInput,
  ProductStatus,
} from '@milcow/shared';
import {
  approveContract,
  askCopilot,
  cancelOrderWithReason,
  createProduct,
  findPickupByCode,
  getAdminContracts,
  getAdminOrders,
  getAdminProduct,
  getAdminProducts,
  getAdminStats,
  getInquiries,
  getOrder,
  getPickups,
  markInquiryAnswered,
  reindexKnowledge,
  rejectContract,
  setOrderStatus,
  setPickupStatus,
  setProductStatus,
  updateProduct,
  type AdminOrderFilters,
} from '@/services/admin.service';

/** Everything admin lives under ['admin'] → one invalidate refreshes the console */
export const adminKeys = {
  all: ['admin'] as const,
  stats: ['admin', 'stats'] as const,
  orders: (f: AdminOrderFilters) => ['admin', 'orders', f] as const,
  order: (id: string) => ['admin', 'order', id] as const,
  contracts: (s?: ContractStatus) => ['admin', 'contracts', s ?? 'all'] as const,
  pickups: (date: string) => ['admin', 'pickups', date] as const,
  products: ['admin', 'products'] as const,
  product: (id: string) => ['admin', 'product', id] as const,
  inquiries: (s?: InquiryStatus) => ['admin', 'inquiries', s ?? 'all'] as const,
};

/** After any admin change: the console + the buyer-side lists (same browser, other tab) */
function useRefresh() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: adminKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['orders'] }),
      queryClient.invalidateQueries({ queryKey: ['contracts'] }),
    ]);
}

export const useAdminStats = () =>
  useQuery({ queryKey: adminKeys.stats, queryFn: getAdminStats, staleTime: 30_000 });

export const useAdminOrders = (filters: AdminOrderFilters) =>
  useQuery({
    queryKey: adminKeys.orders(filters),
    queryFn: () => getAdminOrders(filters),
    placeholderData: keepPreviousData, // keep the table while the next page loads
  });

export const useAdminOrder = (id: string | null) =>
  useQuery({
    queryKey: adminKeys.order(id ?? ''),
    queryFn: () => getOrder(id!),
    enabled: !!id,
  });

export function useOrderAction() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (v: { id: string; status: OrderStatus } | { id: string; cancel: string }) =>
      'cancel' in v ? cancelOrderWithReason(v.id, v.cancel) : setOrderStatus(v.id, v.status),
    onSuccess: refresh,
  });
}

export const useAdminContracts = (status?: ContractStatus) =>
  useQuery({ queryKey: adminKeys.contracts(status), queryFn: () => getAdminContracts(status) });

export function useContractReview() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (v: { id: string; approve: true } | { id: string; reason: string }) =>
      'reason' in v ? rejectContract(v.id, v.reason) : approveContract(v.id),
    onSuccess: refresh,
  });
}

export const usePickups = (date: string) =>
  useQuery({ queryKey: adminKeys.pickups(date), queryFn: () => getPickups(date) });

export const usePickupLookup = () => useMutation({ mutationFn: findPickupByCode });

export function usePickupStep() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (v: { id: string; status: PickupStatus }) => setPickupStatus(v.id, v.status),
    onSuccess: refresh,
  });
}

export const useAdminProducts = () =>
  useQuery({ queryKey: adminKeys.products, queryFn: getAdminProducts });

export const useAdminProduct = (id: string | null) =>
  useQuery({
    queryKey: adminKeys.product(id ?? ''),
    queryFn: () => getAdminProduct(id!),
    enabled: !!id,
  });

export function useSaveProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { id?: string; input: ProductAdminInput }) =>
      v.id ? updateProduct(v.id, v.input) : createProduct(v.input),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
      ]),
  });
}

export function useProductStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; status: ProductStatus }) => setProductStatus(v.id, v.status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.products }),
  });
}

export const useReindexKnowledge = () => useMutation({ mutationFn: reindexKnowledge });

export const useInquiries = (status?: InquiryStatus) =>
  useQuery({ queryKey: adminKeys.inquiries(status), queryFn: () => getInquiries(status) });

export function useMarkAnswered() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markInquiryAnswered,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  });
}

export const useCopilot = () => useMutation({ mutationFn: askCopilot });
