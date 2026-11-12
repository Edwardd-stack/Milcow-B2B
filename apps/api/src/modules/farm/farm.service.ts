import { Injectable, NotFoundException } from '@nestjs/common';
import type { FarmInfo } from '@milcow/shared';
import { PrismaService } from '../../libs/prisma/prisma.service';
import { toFarmInfo } from './farm.mapper';

@Injectable()
export class FarmService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<FarmInfo[]> {
    const farms = await this.prisma.farm.findMany({ orderBy: { createdAt: 'asc' } });
    return farms.map(toFarmInfo);
  }

  async findOne(id: string): Promise<FarmInfo> {
    const farm = await this.prisma.farm.findUnique({ where: { id } });
    if (!farm) throw new NotFoundException('Farm not found');
    return toFarmInfo(farm);
  }
}
