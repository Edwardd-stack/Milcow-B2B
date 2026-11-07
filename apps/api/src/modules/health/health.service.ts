import { Injectable } from '@nestjs/common';
import { LOCALES } from '@milcow/shared';

@Injectable()
export class HealthService {
  check() {
    return {
      status: 'ok',
      service: 'milcow-api',
      uptimeSec: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      locales: LOCALES, // imported from packages/shared — proves the monorepo link works
    };
  }
}
