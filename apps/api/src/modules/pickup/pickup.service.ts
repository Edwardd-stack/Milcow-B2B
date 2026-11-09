import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Paginated, PickupInfo, PickupSlotInfo, PickupStatus } from '@milcow/shared';
import { randomInt } from 'node:crypto';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../libs/prisma/prisma.service';
import type { AuthMember } from '../../libs/types/auth.type';
import { koreaDayRange } from '../../libs/utils/date.util';
import { toPaginated, toSkipTake } from '../../libs/utils/pagination.util';
import type { CreatePickupDto } from './dto/create-pickup.dto';
import type { PickupListQueryDto } from './dto/pickup-list-query.dto';
import type { PickupSlotQueryDto } from './dto/pickup-slot-query.dto';
import { PICKUP_ORDER_SYNC, PICKUP_STATUS_FLOW } from './pickup.constants';
import { pickupInclude, toPickupInfo, toPickupSlotInfo } from './pickup.mapper';

// No 0/O/1/I — easy to read aloud at the warehouse gate
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@Injectable()
export class PickupService {
  constructor(private readonly prisma: PrismaService) {}

  /** Future slots of one warehouse on one Korean calendar day */
  async findSlots(query: PickupSlotQueryDto): Promise<PickupSlotInfo[]> {
    const range = koreaDayRange(query.date);
    const slots = await this.prisma.pickupSlot.findMany({
      where: {
        warehouseId: query.warehouseId,
        slotStart: { gte: new Date(Math.max(range.gte.getTime(), Date.now())), lt: range.lt },
      },
      orderBy: { slotStart: 'asc' },
    });
    return slots.map(toPickupSlotInfo);
  }

  /** A buyer books a time slot for a PICKUP order. */
  async create(member: AuthMember, input: CreatePickupDto): Promise<PickupInfo> {
    const pickup = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: input.orderId, memberId: member.id },
        include: { pickup: true },
      });
      if (!order) throw new NotFoundException('Order not found');
      if (order.orderDeliveryType !== 'PICKUP')
        throw new BadRequestException('This is a delivery order');
      if (order.orderStatus === 'CANCELLED' || order.orderStatus === 'COMPLETED') {
        throw new BadRequestException('This order is already closed');
      }
      if (order.pickup) throw new ConflictException('A pickup is already booked for this order');

      const slot = await tx.pickupSlot.findUnique({ where: { id: input.pickupSlotId } });
      if (!slot || slot.warehouseId !== order.warehouseId) {
        throw new NotFoundException('Pickup slot not found at the warehouse of this order');
      }
      if (slot.slotStart <= new Date())
        throw new BadRequestException('This slot has already started');

      // Atomic: take a place only if one is left (column-to-column comparison).
      // The CHECK constraint in the database is the second safety net.
      const booked = await tx.pickupSlot.updateMany({
        where: { id: slot.id, slotBooked: { lt: tx.pickupSlot.fields.slotCapacity } },
        data: { slotBooked: { increment: 1 } },
      });
      if (booked.count === 0) throw new ConflictException('This time slot is full');

      return tx.pickup.create({
        data: {
          order: { connect: { id: order.id } },
          pickupSlot: { connect: { id: slot.id } },
          pickupVehicleNo: input.pickupVehicleNo,
          pickupCode: this.generateCode(),
        },
        include: pickupInclude,
      });
    });
    return toPickupInfo(pickup);
  }

  /** BUYER → own, STAFF → own warehouse, ADMIN → all */
  async findAll(member: AuthMember, query: PickupListQueryDto): Promise<Paginated<PickupInfo>> {
    const where: Prisma.PickupWhereInput = {
      ...this.visibilityFilter(member),
      ...(query.pickupStatus && { pickupStatus: query.pickupStatus }),
      ...(query.date && { pickupSlot: { slotStart: koreaDayRange(query.date) } }),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.pickup.findMany({
        where,
        include: pickupInclude,
        orderBy: { pickupSlot: { slotStart: 'asc' } },
        ...toSkipTake(query.page, query.limit),
      }),
      this.prisma.pickup.count({ where }),
    ]);
    return toPaginated(rows.map(toPickupInfo), total, query.page, query.limit);
  }

  /** Warehouse gate: the driver tells the code, staff finds the pickup. */
  async findByCode(member: AuthMember, code: string): Promise<PickupInfo> {
    const pickup = await this.prisma.pickup.findFirst({
      where: { pickupCode: code.toUpperCase(), ...this.visibilityFilter(member) },
      include: pickupInclude,
    });
    if (!pickup) throw new NotFoundException('Pickup not found');
    return toPickupInfo(pickup);
  }

  /** Staff moves the pickup forward; the order status follows (see PICKUP_ORDER_SYNC). */
  async updateStatus(member: AuthMember, id: string, next: PickupStatus): Promise<PickupInfo> {
    const pickup = await this.prisma.$transaction(async (tx) => {
      const current = await tx.pickup.findFirst({
        where: { id, ...this.visibilityFilter(member) },
        include: { order: true },
      });
      if (!current) throw new NotFoundException('Pickup not found');
      if (!PICKUP_STATUS_FLOW[current.pickupStatus].includes(next) || next === 'SCHEDULED') {
        throw new BadRequestException(`Cannot change status ${current.pickupStatus} → ${next}`);
      }

      const sync = PICKUP_ORDER_SYNC[next];
      if (!sync.requires.includes(current.order.orderStatus)) {
        throw new BadRequestException(
          `Order is ${current.order.orderStatus}; ${next} needs ${sync.requires.join(' or ')}`,
        );
      }
      await tx.order.update({ where: { id: current.orderId }, data: { orderStatus: sync.next } });

      return tx.pickup.update({
        where: { id },
        data: { pickupStatus: next },
        include: pickupInclude,
      });
    });
    return toPickupInfo(pickup);
  }

  /** The buyer cancels a booking that has not started loading yet. */
  async cancel(member: AuthMember, id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const pickup = await tx.pickup.findFirst({ where: { id, ...this.visibilityFilter(member) } });
      if (!pickup) throw new NotFoundException('Pickup not found');
      if (pickup.pickupStatus !== 'SCHEDULED') {
        throw new BadRequestException('Loading has already started');
      }
      await tx.pickupSlot.update({
        where: { id: pickup.pickupSlotId },
        data: { slotBooked: { decrement: 1 } },
      });
      await tx.pickup.delete({ where: { id } });
    });
  }

  private visibilityFilter(member: AuthMember): Prisma.PickupWhereInput {
    if (member.memberType === 'ADMIN') return {};
    if (member.memberType === 'STAFF') {
      return { pickupSlot: { warehouseId: member.warehouseId ?? '' } };
    }
    return { order: { memberId: member.id } };
  }

  /** e.g. "MC-7KQ2XP" */
  private generateCode(): string {
    let code = '';
    for (let i = 0; i < 6; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
    return `MC-${code}`;
  }
}
