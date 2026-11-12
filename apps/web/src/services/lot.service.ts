import type { LotPassport, LotSummary, OrderInfo, ProductType, SurplusLot } from '@milcow/shared';
import { apiFetch } from '@/lib/api-client';

export interface SurplusParams {
  productType?: ProductType;
  warehouseId?: string;
  sort?: 'price' | 'expiring';
}

/** GET /lots/featured — newest lots (examples on the passport page) */
export const getFeaturedLots = () => apiFetch<LotSummary[]>('/lots/featured');

/** GET /lots/:code — 원유 품질 여권 */
export const getPassport = (code: string) =>
  apiFetch<LotPassport>(`/lots/${encodeURIComponent(code)}`);

/** GET /surplus — surplus lots with today's dynamic price */
export const getSurplus = (params: SurplusParams = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => value && query.set(key, value));
  const qs = query.toString();
  return apiFetch<SurplusLot[]>(`/surplus${qs ? `?${qs}` : ''}`);
};

/** POST /surplus/:lotId/reserve — PENDING order, price held for 30 minutes */
export const reserveSurplus = (lotId: string, ton: number) =>
  apiFetch<OrderInfo>(`/surplus/${lotId}/reserve`, {
    method: 'POST',
    body: JSON.stringify({ ton }),
  });
