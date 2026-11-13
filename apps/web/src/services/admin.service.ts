import type {
  AdminOrderRow,
  AdminStats,
  ContractInfo,
  ContractStatus,
  CopilotRequest,
  CopilotResponse,
  DeliveryType,
  InquiryInfo,
  InquiryStatus,
  OrderInfo,
  OrderStatus,
  Paginated,
  PickupInfo,
  PickupStatus,
  ProductAdminInfo,
  ProductAdminInput,
  ProductStatus,
  SocketTokenResponse,
} from '@milcow/shared';
import { apiFetch } from '@/lib/api-client';

const patch = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });

const query = (params: object) => {
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return qs ? `?${qs}` : '';
};

// ── Dashboard ──
export const getAdminStats = () => apiFetch<AdminStats>('/admin/stats');

// ── Orders ──
export interface AdminOrderFilters {
  orderStatus?: OrderStatus;
  orderDeliveryType?: DeliveryType;
  warehouseId?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
  limit?: number;
}
export const getAdminOrders = (filters: AdminOrderFilters) =>
  apiFetch<Paginated<AdminOrderRow>>(`/admin/orders${query(filters)}`);
export const getOrder = (id: string) => apiFetch<OrderInfo>(`/orders/${id}`);
export const setOrderStatus = (id: string, orderStatus: OrderStatus) =>
  patch<OrderInfo>(`/orders/${id}/status`, { orderStatus });
export const cancelOrderWithReason = (id: string, reason?: string) =>
  patch<OrderInfo>(`/orders/${id}/cancel`, { reason });

// ── Contracts ──
export const getAdminContracts = (contractStatus?: ContractStatus) =>
  apiFetch<Paginated<ContractInfo>>(`/contracts${query({ contractStatus, limit: 50 })}`);
export const approveContract = (id: string) => patch<ContractInfo>(`/contracts/${id}/approve`);
export const rejectContract = (id: string, reason: string) =>
  patch<ContractInfo>(`/contracts/${id}/reject`, { reason });

// ── Pickup gate ──
export const findPickupByCode = (code: string) =>
  apiFetch<PickupInfo>(`/pickups/code/${encodeURIComponent(code.trim().toUpperCase())}`);
export const getPickups = (date: string) =>
  apiFetch<Paginated<PickupInfo>>(`/pickups${query({ date, limit: 50 })}`);
export const setPickupStatus = (id: string, pickupStatus: PickupStatus) =>
  patch<PickupInfo>(`/pickups/${id}/status`, { pickupStatus });

// ── Products ──
export const getAdminProducts = () => apiFetch<ProductAdminInfo[]>('/admin/products');
export const getAdminProduct = (id: string) => apiFetch<ProductAdminInfo>(`/admin/products/${id}`);
export const createProduct = (input: ProductAdminInput) =>
  apiFetch<ProductAdminInfo>('/admin/products', { method: 'POST', body: JSON.stringify(input) });
export const updateProduct = (id: string, input: ProductAdminInput) =>
  patch<ProductAdminInfo>(`/admin/products/${id}`, input);
export const setProductStatus = (id: string, productStatus: ProductStatus) =>
  patch<ProductAdminInfo>(`/admin/products/${id}/status`, { productStatus });
export const reindexKnowledge = () =>
  apiFetch<{ totalChunks: number; embedded: number }>('/ai/knowledge/ingest', { method: 'POST' });

// ── Inquiries ──
export const getInquiries = (inquiryStatus?: InquiryStatus) =>
  apiFetch<Paginated<InquiryInfo>>(`/inquiries${query({ inquiryStatus, limit: 50 })}`);
export const markInquiryAnswered = (id: string) => patch<InquiryInfo>(`/inquiries/${id}/answered`);

// ── Copilot ──
export const askCopilot = (input: CopilotRequest) =>
  apiFetch<CopilotResponse>('/admin/copilot', { method: 'POST', body: JSON.stringify(input) });

// ── Realtime ──
export const getSocketToken = () => apiFetch<SocketTokenResponse>('/auth/socket-token');
