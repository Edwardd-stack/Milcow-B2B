import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  surplusPrice,
  SURPLUS_HOLD_MINUTES,
  type LotPassport,
  type LotSummary,
  type OrderInfo,
  type SurplusLot,
} from '@milcow/shared';
import { PrismaService } from '../../libs/prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import type { AuthMember } from '../../libs/types/auth.type';
import { orderInclude, toOrderInfo } from '../order/order.mapper';
import type { ReserveSurplusDto } from './dto/reserve-surplus.dto';
import type { SurplusQueryDto } from './dto/surplus-query.dto';
import { lotInclude, toLotPassport, toLotSummary, toSurplusLot } from './lot.mapper';

const FEATURED_COUNT = 6;

@Injectable()
export class LotService {
  private readonly logger = new Logger(LotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  /** 원유 품질 여권 — public; the code is case-insensitive */
  async passport(code: string): Promise<LotPassport> {
    const lot = await this.prisma.lot.findUnique({
      where: { lotCode: code.trim().toUpperCase() },
      include: lotInclude,
    });
    if (!lot) throw new NotFoundException('Lot not found');
    return toLotPassport(lot);
  }

  /** Example lots for the passport page: the newest ones */
  async featured(): Promise<LotSummary[]> {
    const lots = await this.prisma.lot.findMany({
      orderBy: { lotMilkedAt: 'desc' },
      take: FEATURED_COUNT,
      include: lotInclude,
    });
    return lots.map(toLotSummary);
  }

  /** 잉여 원유 매칭: surplus lots that can still be bought, priced right now */
  async surplus(query: SurplusQueryDto): Promise<SurplusLot[]> {
    await this.releaseExpiredHolds();
    const now = new Date();
    const lots = await this.prisma.lot.findMany({
      where: {
        lotIsSurplus: true,
        lotStatus: 'IN_STOCK',
        lotUseBy: { gt: now },
        lotRemainingTon: { gt: 0 },
        ...(query.warehouseId && { warehouseId: query.warehouseId }),
        ...(query.productType && { product: { productType: query.productType } }),
      },
      include: lotInclude,
      orderBy: { lotUseBy: 'asc' },
    });
    const list = lots.map((lot) => toSurplusLot(lot, now));
    if (query.sort === 'price') list.sort((a, b) => a.pricePerTon - b.pricePerTon);
    return list;
  }

  /**
   * Reserve tons of a surplus lot at TODAY's dynamic price → a PENDING pickup order held for
   * 30 minutes. The tons are taken with "update only if enough is left", so two buyers
   * can never get the same last ton.
   */
  async reserve(member: AuthMember, lotId: string, input: ReserveSurplusDto): Promise<OrderInfo> {
    await this.releaseExpiredHolds();
    const now = new Date();

    const order = await this.prisma.$transaction(async (tx) => {
      const lot = await tx.lot.findUnique({ where: { id: lotId } });
      if (!lot || !lot.lotIsSurplus) throw new NotFoundException('Surplus lot not found');
      if (lot.lotStatus !== 'IN_STOCK' || lot.lotUseBy <= now) {
        throw new ConflictException('This lot is no longer available');
      }

      const taken = await tx.lot.updateMany({
        where: { id: lot.id, lotRemainingTon: { gte: input.ton } },
        data: { lotRemainingTon: { decrement: input.ton } },
      });
      if (taken.count === 0) throw new ConflictException('Not enough left in this lot');

      const { pricePerTon } = surplusPrice(
        lot.lotBasePricePerTon,
        lot.lotMilkedAt,
        lot.lotUseBy,
        now,
      );
      const created = await tx.order.create({
        data: {
          memberId: member.id,
          warehouseId: lot.warehouseId,
          orderDeliveryType: 'PICKUP',
          orderTotal: Math.round(pricePerTon * input.ton),
          orderHoldUntil: new Date(now.getTime() + SURPLUS_HOLD_MINUTES * 60_000),
          items: {
            create: [
              {
                productId: lot.productId,
                lotId: lot.id,
                itemTon: input.ton,
                itemPricePerTon: pricePerTon,
              },
            ],
          },
          events: {
            create: [
              {
                eventType: 'CREATED',
                eventTo: 'PENDING',
                eventNote: `잉여 원유 예약 ${lot.lotCode}`,
                memberId: member.id,
              },
            ],
          },
        },
        include: orderInclude,
      });

      // Sold out → close the lot
      await tx.lot.updateMany({
        where: { id: lot.id, lotRemainingTon: { lte: 0 } },
        data: { lotStatus: 'SOLD_OUT' },
      });
      return created;
    });
    this.realtime.orderCreated(
      {
        orderId: order.id,
        orderTotal: order.orderTotal.toNumber(),
        companyName: null,
        createdAt: order.createdAt.toISOString(),
      },
      order.warehouseId,
    );
    return toOrderInfo(order);
  }

  /** Unpaid surplus reservations past their hold → cancelled, tons go back to the lot */
  async releaseExpiredHolds(): Promise<number> {
    const expired = await this.prisma.order.findMany({
      where: { orderStatus: 'PENDING', orderHoldUntil: { lte: new Date() } },
      include: { items: true },
    });
    for (const order of expired) {
      await this.prisma.$transaction(async (tx) => {
        // Re-check inside the transaction: the buyer may have paid a moment ago
        const changed = await tx.order.updateMany({
          where: { id: order.id, orderStatus: 'PENDING' },
          data: { orderStatus: 'CANCELLED' },
        });
        if (changed.count === 0) return;
        for (const item of order.items) {
          if (!item.lotId) continue;
          await tx.lot.update({
            where: { id: item.lotId },
            data: { lotRemainingTon: { increment: item.itemTon }, lotStatus: 'IN_STOCK' },
          });
        }
        await tx.orderEvent.create({
          data: {
            orderId: order.id,
            eventType: 'CANCELLED',
            eventFrom: 'PENDING',
            eventTo: 'CANCELLED',
            eventNote: '예약 시간 초과 (30분)',
          },
        });
      });
    }
    if (expired.length > 0) this.logger.log(`Released ${expired.length} expired surplus holds`);
    return expired.length;
  }
}
