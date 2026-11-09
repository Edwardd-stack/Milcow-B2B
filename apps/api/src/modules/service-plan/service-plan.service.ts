import { Injectable } from '@nestjs/common';
import type { ServicePlanInfo } from '@milcow/shared';
import { PrismaService } from '../../libs/prisma/prisma.service';
import { toServicePlanInfo } from './service-plan.mapper';

@Injectable()
export class ServicePlanService {
  constructor(private readonly prisma: PrismaService) {}

  async findActive(): Promise<ServicePlanInfo[]> {
    const plans = await this.prisma.servicePlan.findMany({
      where: { serviceStatus: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
    });
    return plans.map(toServicePlanInfo);
  }
}
