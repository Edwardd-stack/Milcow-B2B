import type {
  DeliveryType,
  OrderInfo,
  OrderStatus,
  Paginated,
  PaymentInfo,
  PaymentPrepareResponse,
} from '@milcow/shared';
import { apiFetch } from '@/lib/api-client';

export interface CreateOrderInput {
  warehouseId: string;
  orderDeliveryType: DeliveryType;
  orderAddress?: string; // DELIVERY only
  orderScheduledDate?: string; // YYYY-MM-DD
  items: { productId: string; itemTon: number }[];
}

export interface OrderListParams {
  page?: number;
  limit?: number;
  orderStatus?: OrderStatus;
}

const post = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });

/** POST /orders — creates a PENDING order and reserves the stock */
export const createOrder = (input: CreateOrderInput) => post<OrderInfo>('/orders', input);

/** GET /orders — the buyer's own orders, newest first (empty params are left out of the URL) */
export const getMyOrders = (params: OrderListParams = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  const qs = query.toString();
  return apiFetch<Paginated<OrderInfo>>(`/orders${qs ? `?${qs}` : ''}`);
};

/** PATCH /orders/:id/cancel — gives the reserved stock back */
export const cancelOrder = (orderId: string) =>
  apiFetch<OrderInfo>(`/orders/${orderId}/cancel`, { method: 'PATCH' });

/** POST /payments/prepare — the server decides the amount; returns what the Toss window needs */
export const preparePayment = (orderId: string) =>
  post<PaymentPrepareResponse>('/payments/prepare', { orderId });

/** POST /payments/confirm — after Toss's successUrl: the server verifies with Toss, order → PAID */
export const confirmPayment = (input: {
  paymentKey: string;
  tossOrderId: string;
  amount: number;
}) => post<PaymentInfo>('/payments/confirm', input);

/** POST /payments/fail — after Toss's failUrl */
export const failPayment = (input: { tossOrderId: string; code?: string; message?: string }) =>
  post<PaymentInfo>('/payments/fail', input);
