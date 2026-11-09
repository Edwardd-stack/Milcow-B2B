import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { DeliveryType, OrderInfo, OrderStatus, Paginated } from '@milcow/shared';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../libs/prisma/prisma.service';
import type { AuthMember } from '../../libs/types/auth.type';
import { fromDateString } from '../../libs/utils/date.util';
import { toPaginated, toSkipTake } from '../../libs/utils/pagination.util';
import type { CreateOrderDto } from './dto/create-order.dto';
import type { OrderListQueryDto } from './dto/order-list-query.dto';
import { ORDER_STATUS_FLOW, STATUS_DELIVERY_TYPE } from './order.constants';
import { orderInclude, toOrderInfo } from './order.mapper';

export interface PlaceOrderParams {
  memberId: string;
  warehouseId: string;
  deliveryType: DeliveryType;
  address: string | null;
  scheduledDate: string | null; // YYYY-MM-DD
  contractId?: string;
  items: { productId: string; itemTon: number; pricePerTon?: number }[];
}

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  /** POST /orders — a buyer places an order at today's prices. */
  async create(member: AuthMember, input: CreateOrderDto): Promise<OrderInfo> {
    const order = await this.prisma.$transaction((tx) =>
      this.placeOrder(tx, {
        memberId: member.id,
        warehouseId: input.warehouseId,
        deliveryType: input.orderDeliveryType,
        address: input.orderAddress ?? null,
        scheduledDate: input.orderScheduledDate ?? null,
        items: input.items,
      }),
    );
    return toOrderInfo(order);
  }

  /**
   * Creates an order inside the caller's transaction (also used by contracts):
   *   1. validate products and minimum order amounts
   *   2. reserve stock (atomic: fails if another order took it first)
   *   3. save the order with price snapshots
   * If any step throws, the whole transaction is rolled back — no half-created orders, no lost stock.
   */
  async placeOrder(tx: Prisma.TransactionClient, params: PlaceOrderParams) {
    const productIds = params.items.map((item) => item.productId);
    if (new Set(productIds).size !== productIds.length) {
      throw new BadRequestException('Each product can appear only once in an order');
    }

    const products = await tx.product.findMany({
      where: { id: { in: productIds }, productStatus: 'ACTIVE' },
    });
    const productById = new Map(products.map((p) => [p.id, p]));

    let orderTotal = new Prisma.Decimal(0);
    const itemsData: Prisma.OrderItemCreateWithoutOrderInput[] = [];

    for (const item of params.items) {
      const product = productById.get(item.productId);
      if (!product) throw new NotFoundException(`Product ${item.productId} not found`);

      // Contract orders were already checked when the contract was signed
      if (!params.contractId && product.productMinOrderTon.greaterThan(item.itemTon)) {
        throw new BadRequestException(
          `Minimum order for this product is ${product.productMinOrderTon.toString()} t`,
        );
      }

      // Atomic stock reservation: "decrease only if enough is left".
      // Two buyers ordering the last tons at the same time → only one succeeds.
      const reserved = await tx.inventory.updateMany({
        where: {
          productId: product.id,
          warehouseId: params.warehouseId,
          inventoryTon: { gte: item.itemTon },
        },
        data: { inventoryTon: { decrement: item.itemTon } },
      });
      if (reserved.count === 0) {
        throw new ConflictException('Not enough stock in this warehouse for one of the products');
      }

      // Contracts keep their signed price; normal orders use today's price
      const pricePerTon = item.pricePerTon ?? product.productPricePerTon;
      orderTotal = orderTotal.add(
        new Prisma.Decimal(pricePerTon).mul(item.itemTon).toDecimalPlaces(0),
      );
      itemsData.push({
        product: { connect: { id: product.id } },
        itemTon: item.itemTon,
        itemPricePerTon: pricePerTon, // snapshot
      });
    }

    return tx.order.create({
      data: {
        member: { connect: { id: params.memberId } },
        warehouse: { connect: { id: params.warehouseId } },
        ...(params.contractId && { contract: { connect: { id: params.contractId } } }),
        orderDeliveryType: params.deliveryType,
        orderAddress: params.deliveryType === 'DELIVERY' ? params.address : null,
        orderScheduledDate: params.scheduledDate ? fromDateString(params.scheduledDate) : null,
        orderTotal,
        items: { create: itemsData },
      },
      include: orderInclude,
    });
  }

  /** BUYER → own orders, STAFF → own warehouse, ADMIN → all */
  async findAll(member: AuthMember, query: OrderListQueryDto): Promise<Paginated<OrderInfo>> {
    const where: Prisma.OrderWhereInput = {
      ...this.visibilityFilter(member),
      ...(query.orderStatus && { orderStatus: query.orderStatus }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        ...toSkipTake(query.page, query.limit),
      }),
      this.prisma.order.count({ where }),
    ]);

    return toPaginated(rows.map(toOrderInfo), total, query.page, query.limit);
  }

  async findOne(member: AuthMember, id: string): Promise<OrderInfo> {
    const order = await this.prisma.order.findFirst({
      where: { id, ...this.visibilityFilter(member) },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Order not found');
    return toOrderInfo(order);
  }

  async updateStatus(member: AuthMember, id: string, next: OrderStatus): Promise<OrderInfo> {
    const order = await this.prisma.$transaction(async (tx) => {
      const current = await tx.order.findFirst({
        where: { id, ...this.visibilityFilter(member) },
        include: { items: true, pickup: true },
      });
      if (!current) throw new NotFoundException('Order not found');

      if (!ORDER_STATUS_FLOW[current.orderStatus].includes(next)) {
        throw new BadRequestException(`Cannot change status ${current.orderStatus} → ${next}`);
      }
      const requiredType = STATUS_DELIVERY_TYPE[next];
      if (requiredType && requiredType !== current.orderDeliveryType) {
        throw new BadRequestException(`${next} is only for ${requiredType} orders`);
      }
      if (member.memberType === 'BUYER' && next !== 'CANCELLED') {
        throw new ForbiddenException('Buyers can only cancel their orders');
      }

      if (next === 'CANCELLED') {
        // Free the booked pickup slot
        if (current.pickup) {
          await tx.pickupSlot.update({
            where: { id: current.pickup.pickupSlotId },
            data: { slotBooked: { decrement: 1 } },
          });
          await tx.pickup.delete({ where: { id: current.pickup.id } });
        }
        // Give the reserved stock back to the warehouse
        for (const item of current.items) {
          await tx.inventory.updateMany({
            where: { productId: item.productId, warehouseId: current.warehouseId },
            data: { inventoryTon: { increment: item.itemTon } },
          });
        }
      }

      return tx.order.update({
        where: { id },
        data: { orderStatus: next },
        include: orderInclude,
      });
    });

    return toOrderInfo(order);
  }

  private visibilityFilter(member: AuthMember): Prisma.OrderWhereInput {
    if (member.memberType === 'ADMIN') return {};
    if (member.memberType === 'STAFF') return { warehouseId: member.warehouseId ?? '' };
    return { memberId: member.id };
  }
}
