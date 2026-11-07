import type { Locale } from './common.type';

/** GET /api/v1/health — used by apps/api (returns it) and apps/web (reads it). */
export interface HealthResponse {
  status: 'ok';
  service: string;
  uptimeSec: number;
  timestamp: string; // ISO date
  locales: readonly Locale[];
}
