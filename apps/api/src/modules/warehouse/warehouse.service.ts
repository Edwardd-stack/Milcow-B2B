import { Injectable } from '@nestjs/common';
import type { WarehouseInfo } from '@milcow/shared';
import { PrismaService } from '../../libs/prisma/prisma.service';
import { toWarehouseInfo } from './warehouse.mapper';

@Injectable()
export class WarehouseService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<WarehouseInfo[]> {
    const warehouses = await this.prisma.warehouse.findMany({ orderBy: { createdAt: 'asc' } });
    return warehouses.map(toWarehouseInfo);
  }
}
