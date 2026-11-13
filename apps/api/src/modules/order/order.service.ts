import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  refundDecision,
  type AdminOrderRow,
  type DeliveryType,
  type OrderInfo,
  type OrderStatus,
  type Paginated,
} from '@milcow/shared';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../libs/prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import type { AuthMember } from '../../libs/types/auth.type';
import { assertDemoCanModify } from '../../common/policies/demo.policy';
import { TossPaymentsClient, TossPaymentsError } from '../../libs/toss/toss-payments.client';
import { fromDateString, koreaDayRange } from '../../libs/utils/date.util';
import { toPaginated, toSkipTake } from '../../libs/utils/pagination.util';
import type { CreateOrderDto } from './dto/create-order.dto';
import type { OrderListQueryDto } from './dto/order-list-query.dto';
import { ORDER_STATUS_FLOW, STATUS_DELIVERY_TYPE } from './order.constants';
import { recordOrderEvent } from './order-events';
import {
  orderAdminInclude,
  orderInclude,
  orderRowInclude,
  toAdminOrderRow,
  toOrderAdminInfo,
  toOrderInfo,
} from './order.mapper';

export interface PlaceOrderParams {
  memberId: string;
  warehouseId: string;
  deliveryType: DeliveryType;
  address: string | null;
  scheduledDate: string | null; // YYYY-MM-DD
  contractId?: string;
  serviceFee?: number; // KRW, contract add-on services for this delivery
  items: { productId: string; itemTon: number; pricePerTon?: number }[];
}

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
    private readonly toss: TossPaymentsClient,
  ) {}

  /** POST /orders — a buyer places an order at today's prices. */
  async create(member: AuthMember, input: CreateOrderDto): Promise<OrderInfo> {
    const order = await this.prisma.$transaction(async (tx) => {
      const created = await this.placeOrder(tx, {
        memberId: member.id,
        warehouseId: input.warehouseId,
        deliveryType: input.orderDeliveryType,
        address: input.orderAddress ?? null,
        scheduledDate: input.orderScheduledDate ?? null,
        items: input.items,
      });
      await recordOrderEvent(tx, {
        orderId: created.id,
        eventType: 'CREATED',
        to: 'PENDING',
        memberId: member.id,
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

    const serviceFee = new Prisma.Decimal(params.serviceFee ?? 0);

    return tx.order.create({
      data: {
        member: { connect: { id: params.memberId } },
        warehouse: { connect: { id: params.warehouseId } },
        ...(params.contractId && { contract: { connect: { id: params.contractId } } }),
        orderDeliveryType: params.deliveryType,
        orderAddress: params.deliveryType === 'DELIVERY' ? params.address : null,
        orderScheduledDate: params.scheduledDate ? fromDateString(params.scheduledDate) : null,
        orderServiceFee: serviceFee,
        orderTotal: orderTotal.add(serviceFee),
        items: { create: itemsData },
      },
      include: orderInclude,
    });
  }

  /** BUYER → own orders, STAFF → own warehouse, ADMIN → all */
  async findAll(member: AuthMember, query: OrderListQueryDto): Promise<Paginated<OrderInfo>> {
    const where = await this.listWhere(member, query);
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

  /** GET /admin/orders — table rows with the customer (masked in demo sessions) */
  async findAdminRows(
    member: AuthMember,
    query: OrderListQueryDto,
  ): Promise<Paginated<AdminOrderRow>> {
    const where = await this.listWhere(member, query);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: orderRowInclude,
        orderBy: { createdAt: 'desc' },
        ...toSkipTake(query.page, query.limit),
      }),
      this.prisma.order.count({ where }),
    ]);
    return toPaginated(
      rows.map((row) => toAdminOrderRow(member, row)),
      total,
      query.page,
      query.limit,
    );
  }

  /** Buyers get their order; admin / staff also get the customer, payment and history */
  async findOne(member: AuthMember, id: string): Promise<OrderInfo> {
    const where = { id, ...this.visibilityFilter(member) };
    if (member.memberType === 'BUYER') {
      const order = await this.prisma.order.findFirst({ where, include: orderInclude });
      if (!order) throw new NotFoundException('Order not found');
      return toOrderInfo(order);
    }
    const order = await this.prisma.order.findFirst({ where, include: orderAdminInclude });
    if (!order) throw new NotFoundException('Order not found');
    return toOrderAdminInfo(member, order);
  }

  /** Admin / staff move an order forward (PAID → PREPARING → SHIPPING / READY → COMPLETED) */
  async updateStatus(member: AuthMember, id: string, next: OrderStatus): Promise<OrderInfo> {
    if (next === 'CANCELLED') return this.cancel(member, id);

    const order = await this.prisma.$transaction(async (tx) => {
      const current = await tx.order.findFirst({
        where: { id, ...this.visibilityFilter(member) },
        include: { member: { select: { memberIsDemo: true } } },
      });
      if (!current) throw new NotFoundException('Order not found');
      assertDemoCanModify(member, current.member.memberIsDemo);

      if (!ORDER_STATUS_FLOW[current.orderStatus].includes(next)) {
        throw new BadRequestException(`Cannot change status ${current.orderStatus} → ${next}`);
      }
      const requiredType = STATUS_DELIVERY_TYPE[next];
      if (requiredType && requiredType !== current.orderDeliveryType) {
        throw new BadRequestException(`${next} is only for ${requiredType} orders`);
      }
      if (next === 'PAID') {
        throw new BadRequestException('An order becomes PAID only through a payment');
      }

      // Only if nobody changed it in the meantime (two admins clicking at once)
      const moved = await tx.order.updateMany({
        where: { id, orderStatus: current.orderStatus },
        data: { orderStatus: next },
      });
      if (moved.count === 0) throw new ConflictException('The order was changed, please reload');

      await recordOrderEvent(tx, {
        orderId: id,
        eventType: 'STATUS_CHANGED',
        from: current.orderStatus,
        to: next,
        memberId: member.id,
      });
      return tx.order.findUniqueOrThrow({ where: { id }, include: orderInclude });
    });

    this.pushUpdate(order);
    return toOrderInfo(order);
  }

  /**
   * Cancel an order and give everything back:
   *   - buyer: only before payment (PENDING)
   *   - admin: PENDING or PAID; a paid order is refunded (Toss cancel API, or just marked for
   *     demo payments). Toss is called first, outside the transaction — if it fails, nothing changes.
   */
  async cancel(member: AuthMember, id: string, reason?: string): Promise<OrderInfo> {
    const current = await this.prisma.order.findFirst({
      where: { id, ...this.visibilityFilter(member) },
      include: {
        member: { select: { memberIsDemo: true } },
        payments: { where: { paymentStatus: 'DONE' }, take: 1 },
      },
    });
    if (!current) throw new NotFoundException('Order not found');
    assertDemoCanModify(member, current.member.memberIsDemo);

    if (!ORDER_STATUS_FLOW[current.orderStatus].includes('CANCELLED')) {
      throw new BadRequestException(`Cannot cancel an order that is ${current.orderStatus}`);
    }
    if (member.memberType === 'BUYER' && current.orderStatus !== 'PENDING') {
      throw new ForbiddenException('A paid order can be cancelled only by Milcow (with a refund)');
    }
    if (member.memberType === 'STAFF') {
      throw new ForbiddenException('Warehouse staff cannot cancel orders');
    }

    const payment = current.payments[0] ?? null;
    const refund = refundDecision(payment);
    const note = reason?.trim() || (member.memberType === 'BUYER' ? '고객 취소' : '관리자 취소');

    if (refund === 'toss' && payment?.paymentKey) {
      try {
        await this.toss.cancel(payment.paymentKey, note, `refund-${payment.id}`);
      } catch (error) {
        if (error instanceof TossPaymentsError) throw new BadRequestException(error.message);
        this.logger.error('Toss refund failed', error instanceof Error ? error.stack : error);
        throw new BadGatewayException('Payment provider is not reachable, please try again');
      }
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const moved = await tx.order.updateMany({
        where: { id, orderStatus: current.orderStatus },
        data: { orderStatus: 'CANCELLED' },
      });
      if (moved.count === 0) throw new ConflictException('The order was changed, please reload');

      await this.releaseStock(tx, id);
      await recordOrderEvent(tx, {
        orderId: id,
        eventType: 'CANCELLED',
        from: current.orderStatus,
        to: 'CANCELLED',
        note,
        memberId: member.id,
      });
      if (refund !== 'none' && payment) {
        await tx.payment.update({ where: { id: payment.id }, data: { paymentStatus: 'CANCELED' } });
        await recordOrderEvent(tx, {
          orderId: id,
          eventType: 'REFUNDED',
          note: `₩${payment.paymentAmount.toNumber().toLocaleString('en-US')}${refund === 'demo' ? ' (demo)' : ''}`,
          memberId: member.id,
        });
      }
      return tx.order.findUniqueOrThrow({ where: { id }, include: orderInclude });
    });

    this.pushUpdate(order);
    return toOrderInfo(order);
  }

  /**
   * Gives back what an order holds: the pickup slot, and the tons —
   * surplus reservations → to their milk lot, everything else → warehouse stock.
   * Also used when an unpaid surplus hold expires.
   */
  async releaseStock(tx: Prisma.TransactionClient, orderId: string): Promise<void> {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true, pickup: true },
    });
    if (order.pickup) {
      await tx.pickupSlot.update({
        where: { id: order.pickup.pickupSlotId },
        data: { slotBooked: { decrement: 1 } },
      });
      await tx.pickup.delete({ where: { id: order.pickup.id } });
    }
    for (const item of order.items) {
      if (order.orderHoldUntil && item.lotId) {
        await tx.lot.update({
          where: { id: item.lotId },
          data: { lotRemainingTon: { increment: item.itemTon }, lotStatus: 'IN_STOCK' },
        });
        continue;
      }
      await tx.inventory.updateMany({
        where: { productId: item.productId, warehouseId: order.warehouseId },
        data: { inventoryTon: { increment: item.itemTon } },
      });
    }
  }

  private pushUpdate(order: {
    id: string;
    orderStatus: OrderStatus;
    updatedAt: Date;
    memberId: string;
    warehouseId: string;
  }) {
    this.realtime.orderUpdated(
      {
        orderId: order.id,
        orderStatus: order.orderStatus,
        updatedAt: order.updatedAt.toISOString(),
      },
      order.memberId,
      order.warehouseId,
    );
  }

  private async listWhere(
    member: AuthMember,
    query: OrderListQueryDto,
  ): Promise<Prisma.OrderWhereInput> {
    const q = query.q?.trim();
    const isStaffView = member.memberType !== 'BUYER';
    // Order numbers on screen are the last 8 hex chars of the id ("…3F9A21C0").
    // A uuid column has no "endsWith" filter in Prisma, so look those ids up with a tiny raw query.
    const idMatches =
      isStaffView && q && /^[0-9a-f]{4,12}$/i.test(q)
        ? (
            await this.prisma.$queryRaw<{ id: string }[]>`
              SELECT id FROM orders WHERE id::text LIKE ${'%' + q.toLowerCase()} LIMIT 50`
          ).map((row) => row.id)
        : [];
    return {
      ...this.visibilityFilter(member),
      ...(query.orderStatus && { orderStatus: query.orderStatus }),
      ...(isStaffView && query.orderDeliveryType && { orderDeliveryType: query.orderDeliveryType }),
      ...(isStaffView &&
        query.warehouseId &&
        member.memberType === 'ADMIN' && {
          warehouseId: query.warehouseId,
        }),
      ...((query.from || query.to) && {
        createdAt: {
          ...(query.from && { gte: koreaDayRange(query.from).gte }),
          ...(query.to && { lt: koreaDayRange(query.to).lt }),
        },
      }),
      ...(isStaffView &&
        q && {
          OR: [
            { member: { memberCompanyName: { contains: q, mode: 'insensitive' } } },
            { member: { memberNick: { contains: q, mode: 'insensitive' } } },
            ...(idMatches.length > 0 ? [{ id: { in: idMatches } }] : []),
          ],
        }),
    };
  }

  private visibilityFilter(member: AuthMember): Prisma.OrderWhereInput {
    if (member.memberType === 'ADMIN') return {};
    if (member.memberType === 'STAFF') return { warehouseId: member.warehouseId ?? '' };
    return { memberId: member.id };
  }
}
