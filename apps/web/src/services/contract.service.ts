import type {
  ContractDraftResponse,
  ContractInfo,
  DeliveryType,
  Locale,
  Paginated,
  ServicePlanInfo,
} from '@milcow/shared';
import { apiFetch } from '@/lib/api-client';

export interface CreateContractInput {
  productId: string;
  warehouseId: string;
  contractStart: string; // YYYY-MM-DD, first delivery (repeats on this day every month)
  contractEnd: string; // YYYY-MM-DD, last delivery
  contractMonthlyTon: number;
  contractDeliveryType: DeliveryType;
  contractAddress?: string;
  servicePlanIds: string[];
}

/** POST /ai/contract-draft — free text → draft + server-calculated prices (nothing is saved) */
export const draftContract = (request: string, locale: Locale) =>
  apiFetch<ContractDraftResponse>('/ai/contract-draft', {
    method: 'POST',
    body: JSON.stringify({ request, locale }),
  });

/** POST /contracts — saves a DRAFT; prices are fixed at this moment */
export const createContract = (input: CreateContractInput) =>
  apiFetch<ContractInfo>('/contracts', { method: 'POST', body: JSON.stringify(input) });

/** GET /contracts — the buyer's own contracts */
export const getContracts = () => apiFetch<Paginated<ContractInfo>>('/contracts?limit=50');

/** PATCH /contracts/:id/submit — DRAFT → REVIEW (Milcow approves it) */
export const submitContract = (id: string) =>
  apiFetch<ContractInfo>(`/contracts/${id}/submit`, { method: 'PATCH' });

/** PATCH /contracts/:id/cancel */
export const cancelContract = (id: string) =>
  apiFetch<ContractInfo>(`/contracts/${id}/cancel`, { method: 'PATCH' });

/** GET /service-plans — add-on services (cold chain, quality test, …) */
export const getServicePlans = () => apiFetch<ServicePlanInfo[]>('/service-plans');

/** The PDF is opened in a new tab; the auth cookie travels with it (same origin) */
export const contractPdfUrl = (id: string, locale: Locale) =>
  `/api/v1/contracts/${id}/pdf?locale=${locale}`;
