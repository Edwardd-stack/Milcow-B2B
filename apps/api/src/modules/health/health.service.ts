import { Injectable } from '@nestjs/common';
import { LOCALES, type HealthResponse } from '@milcow/shared';

@Injectable()
export class HealthService {
  check(): HealthResponse {
    return {
      status: 'ok',
      service: 'milcow-api',
      uptimeSec: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      locales: LOCALES, // imported from packages/shared — proves the monorepo link works
    };
  }
}
