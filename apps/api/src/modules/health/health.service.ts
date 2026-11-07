import { Injectable } from '@nestjs/common';
import { LOCALES, type HealthResponse } from '@milcow/shared';
import { PrismaService } from '../../libs/prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthResponse> {
    return {
      status: 'ok',
      service: 'milcow-api',
      database: await this.checkDatabase(),
      uptimeSec: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      locales: LOCALES,
    };
  }

  private async checkDatabase(): Promise<HealthResponse['database']> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'up';
    } catch {
      return 'down';
    }
  }
}
