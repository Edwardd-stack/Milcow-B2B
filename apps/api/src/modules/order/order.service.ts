import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { OrderInfo, OrderStatus, Paginated } from '@milcow/shared';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../libs/prisma/prisma.service';
import type { AuthMember } from '../../libs/types/auth.type';
import { toPaginated, toSkipTake } from '../../libs/utils/pagination.util';
import type { CreateOrderDto } from './dto/create-order.dto';
import type { OrderListQueryDto } from './dto/order-list-query.dto';
import { ORDER_STATUS_FLOW, STATUS_DELIVERY_TYPE } from './order.constants';
import { orderInclude, toOrderInfo } from './order.mapper';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates an order in ONE transaction:
   *   1. validate products and minimum order amounts
   *   2. reserve stock (atomic: fails if another order took it first)
   *   3. save the order with price snapshots
   * If any step fails, everything is rolled back — no half-created orders, no lost stock.
   */
  async create(member: AuthMember, input: CreateOrderDto): Promise<OrderInfo> {
    const productIds = input.items.map((item) => item.productId);
    if (new Set(productIds).size !== productIds.length) {
      throw new BadRequestException('Each product can appear only once in an order');
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, productStatus: 'ACTIVE' },
      });
      const productById = new Map(products.map((p) => [p.id, p]));

      let orderTotal = new Prisma.Decimal(0);
      const itemsData: Prisma.OrderItemCreateWithoutOrderInput[] = [];

      for (const item of input.items) {
        const product = productById.get(item.productId);
        if (!product) throw new NotFoundException(`Product ${item.productId} not found`);

        if (product.productMinOrderTon.greaterThan(item.itemTon)) {
          throw new BadRequestException(
            `Minimum order for this product is ${product.productMinOrderTon.toString()} t`,
          );
        }

        // Atomic stock reservation: "decrease only if enough is left".
        // Two buyers ordering the last tons at the same time → only one succeeds.
        const reserved = await tx.inventory.updateMany({
          where: {
            productId: product.id,
            warehouseId: input.warehouseId,
            inventoryTon: { gte: item.itemTon },
          },
          data: { inventoryTon: { decrement: item.itemTon } },
        });
        if (reserved.count === 0) {
          throw new ConflictException('Not enough stock in this warehouse for one of the products');
        }

        orderTotal = orderTotal.add(
          new Prisma.Decimal(product.productPricePerTon).mul(item.itemTon).toDecimalPlaces(0),
        );
        itemsData.push({
          product: { connect: { id: product.id } },
          itemTon: item.itemTon,
          itemPricePerTon: product.productPricePerTon, // snapshot
        });
      }

      return tx.order.create({
        data: {
          member: { connect: { id: member.id } },
          warehouse: { connect: { id: input.warehouseId } },
          orderDeliveryType: input.orderDeliveryType,
          orderAddress: input.orderDeliveryType === 'DELIVERY' ? input.orderAddress : null,
          orderScheduledDate: input.orderScheduledDate ? new Date(input.orderScheduledDate) : null,
          orderTotal,
          items: { create: itemsData },
        },
        include: orderInclude,
      });
    });

    return toOrderInfo(order);
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
        include: { items: true },
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
