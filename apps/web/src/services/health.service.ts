import type { HealthResponse } from '@milcow/shared';
import { apiFetch } from '@/lib/api-client';

/** One function per API endpoint. Components never call fetch directly. */
export function getHealth() {
  return apiFetch<HealthResponse>('/health');
}
