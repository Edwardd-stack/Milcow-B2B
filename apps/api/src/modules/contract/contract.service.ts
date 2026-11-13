import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  ContractInfo,
  ContractStatus,
  MonthlyOrderRunResult,
  Paginated,
} from '@milcow/shared';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../libs/prisma/prisma.service';
import type { AuthMember } from '../../libs/types/auth.type';
import { fromDateString, koreaToday, monthlyDates, toDateString } from '../../libs/utils/date.util';
import { toPaginated, toSkipTake } from '../../libs/utils/pagination.util';
import { assertDemoCanModify } from '../../common/policies/demo.policy';
import { recordOrderEvent } from '../order/order-events';
import { toCustomer } from '../order/order.mapper';
import { OrderService } from '../order/order.service';
import { RealtimeService } from '../realtime/realtime.service';
import {
  CONTRACT_MAX_MONTHS,
  CONTRACT_MIN_MONTHS,
  CONTRACT_STATUS_FLOW,
} from './contract.constants';
import { contractInclude, toContractInfo } from './contract.mapper';
import type { ContractListQueryDto } from './dto/contract-list-query.dto';
import type { CreateContractDto } from './dto/create-contract.dto';

@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orderService: OrderService,
    private readonly realtime: RealtimeService,
  ) {}

  /** A buyer creates a DRAFT. Product price and service prices are snapshotted now. */
  async create(member: AuthMember, input: CreateContractDto): Promise<ContractInfo> {
    if (input.contractStart <= koreaToday()) {
      throw new BadRequestException('contractStart must be in the future');
    }
    const deliveries = monthlyDates(input.contractStart, input.contractEnd).length;
    if (input.contractEnd <= input.contractStart || deliveries < CONTRACT_MIN_MONTHS) {
      throw new BadRequestException('contractEnd must be after contractStart');
    }
    if (deliveries > CONTRACT_MAX_MONTHS) {
      throw new BadRequestException(
        `A contract can have at most ${CONTRACT_MAX_MONTHS} deliveries`,
      );
    }

    const [product, warehouse, plans] = await Promise.all([
      this.prisma.product.findFirst({ where: { id: input.productId, productStatus: 'ACTIVE' } }),
      this.prisma.warehouse.findUnique({ where: { id: input.warehouseId } }),
      this.prisma.servicePlan.findMany({
        where: { id: { in: input.servicePlanIds }, serviceStatus: 'ACTIVE' },
      }),
    ]);
    if (!product) throw new NotFoundException('Product not found');
    if (!warehouse) throw new NotFoundException('Warehouse not found');
    if (plans.length !== input.servicePlanIds.length) {
      throw new NotFoundException('One of the service plans was not found');
    }
    if (product.productMinOrderTon.greaterThan(input.contractMonthlyTon)) {
      throw new BadRequestException(
        `Minimum monthly amount for this product is ${product.productMinOrderTon.toString()} t`,
      );
    }

    const contract = await this.prisma.contract.create({
      data: {
        member: { connect: { id: member.id } },
        product: { connect: { id: product.id } },
        warehouse: { connect: { id: warehouse.id } },
        contractStart: fromDateString(input.contractStart),
        contractEnd: fromDateString(input.contractEnd),
        contractMonthlyTon: input.contractMonthlyTon,
        contractPricePerTon: product.productPricePerTon, // snapshot
        contractDeliveryType: input.contractDeliveryType,
        contractAddress: input.contractDeliveryType === 'DELIVERY' ? input.contractAddress : null,
        services: {
          create: plans.map((plan) => ({
            servicePlan: { connect: { id: plan.id } },
            servicePrice: plan.servicePrice, // snapshot
          })),
        },
      },
      include: contractInclude,
    });
    return toContractInfo(contract);
  }

  /** BUYER → own contracts, ADMIN → all */
  async findAll(member: AuthMember, query: ContractListQueryDto): Promise<Paginated<ContractInfo>> {
    const where: Prisma.ContractWhereInput = {
      ...this.visibilityFilter(member),
      ...(query.contractStatus && { contractStatus: query.contractStatus }),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.contract.findMany({
        where,
        include: contractInclude,
        orderBy: { createdAt: 'desc' },
        ...toSkipTake(query.page, query.limit),
      }),
      this.prisma.contract.count({ where }),
    ]);
    return toPaginated(
      rows.map((row) => this.toInfo(member, row)),
      total,
      query.page,
      query.limit,
    );
  }

  async findOne(member: AuthMember, id: string): Promise<ContractInfo> {
    const contract = await this.prisma.contract.findFirst({
      where: { id, ...this.visibilityFilter(member) },
      include: contractInclude,
    });
    if (!contract) throw new NotFoundException('Contract not found');
    return this.toInfo(member, contract);
  }

  async updateStatus(member: AuthMember, id: string, next: ContractStatus): Promise<ContractInfo> {
    const current = await this.prisma.contract.findFirst({
      where: { id, ...this.visibilityFilter(member) },
      include: { member: { select: { memberIsDemo: true } } },
    });
    if (!current) throw new NotFoundException('Contract not found');
    assertDemoCanModify(member, current.member.memberIsDemo);

    if (!CONTRACT_STATUS_FLOW[current.contractStatus].includes(next)) {
      throw new BadRequestException(`Cannot change status ${current.contractStatus} → ${next}`);
    }
    // Buyers may submit their draft or cancel before it becomes ACTIVE; everything else is admin work
    const buyerAllowed =
      (current.contractStatus === 'DRAFT' && (next === 'REVIEW' || next === 'CANCELLED')) ||
      (current.contractStatus === 'REVIEW' && next === 'CANCELLED');
    if (member.memberType === 'BUYER' && !buyerAllowed) {
      throw new ForbiddenException('Only an admin can do this');
    }

    const contract = await this.prisma.contract.update({
      where: { id },
      data: { contractStatus: next },
      include: contractInclude,
    });
    if (next === 'REVIEW') {
      this.realtime.contractSubmitted({
        contractId: contract.id,
        createdAt: contract.updatedAt.toISOString(),
      });
    }
    return this.toInfo(member, contract);
  }

  /** Admin rejects a contract in review: REVIEW → CANCELLED, the reason is shown to the buyer */
  async reject(member: AuthMember, id: string, reason: string): Promise<ContractInfo> {
    const current = await this.prisma.contract.findUnique({
      where: { id },
      include: { member: { select: { memberIsDemo: true } } },
    });
    if (!current) throw new NotFoundException('Contract not found');
    assertDemoCanModify(member, current.member.memberIsDemo);
    if (current.contractStatus !== 'REVIEW') {
      throw new BadRequestException('Only a contract in review can be rejected');
    }
    const contract = await this.prisma.contract.update({
      where: { id },
      data: { contractStatus: 'CANCELLED', contractRejectReason: reason.trim() },
      include: contractInclude,
    });
    return this.toInfo(member, contract);
  }

  /** Admins also see who the customer is (masked for a demo session) */
  private toInfo(
    member: AuthMember,
    contract: Prisma.ContractGetPayload<{ include: typeof contractInclude }>,
  ): ContractInfo {
    const info = toContractInfo(contract);
    if (member.memberType !== 'ADMIN') return info;
    const customer = toCustomer(member, contract.member);
    return {
      ...info,
      customer: {
        companyName: customer.companyName,
        nick: customer.nick,
        email: customer.email,
        phone: customer.phone,
      },
    };
  }

  /**
   * Creates this month's order for every ACTIVE contract whose delivery day is `date`.
   * Safe to run many times for the same date: the unique (contractId, orderScheduledDate)
   * constraint guarantees at most one order per contract per date.
   */
  async runMonthlyOrders(date: string = koreaToday()): Promise<MonthlyOrderRunResult> {
    const day = fromDateString(date);
    const contracts = await this.prisma.contract.findMany({
      where: { contractStatus: 'ACTIVE', contractStart: { lte: day }, contractEnd: { gte: day } },
      include: { services: true },
    });
    const result: MonthlyOrderRunResult = { date, created: [], skipped: [] };

    for (const contract of contracts) {
      const dueDates = monthlyDates(
        toDateString(contract.contractStart),
        toDateString(contract.contractEnd),
      );
      if (!dueDates.includes(date)) continue; // not this contract's delivery day

      try {
        const order = await this.prisma.$transaction(async (tx) => {
          const created = await this.orderService.placeOrder(tx, {
            memberId: contract.memberId,
            warehouseId: contract.warehouseId,
            deliveryType: contract.contractDeliveryType,
            address: contract.contractAddress,
            scheduledDate: date,
            contractId: contract.id,
            serviceFee: contract.services.reduce((sum, s) => sum + s.servicePrice, 0),
            items: [
              {
                productId: contract.productId,
                itemTon: contract.contractMonthlyTon.toNumber(),
                pricePerTon: contract.contractPricePerTon, // the signed price, not today's
              },
            ],
          });
          await recordOrderEvent(tx, {
            orderId: created.id,
            eventType: 'CREATED',
            to: 'PENDING',
            note: '계약 정기 주문',
          });
          return created;
        });
        result.created.push({ contractId: contract.id, orderId: order.id });
      } catch (error) {
        const reason =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
            ? 'Order for this date already exists'
            : error instanceof Error
              ? error.message
              : 'Unknown error';
        result.skipped.push({ contractId: contract.id, reason });
      }
    }

    this.logger.log(
      `Monthly orders ${date}: created ${result.created.length}, skipped ${result.skipped.length}`,
    );
    return result;
  }

  private visibilityFilter(member: AuthMember): Prisma.ContractWhereInput {
    return member.memberType === 'ADMIN' ? {} : { memberId: member.id };
  }
}
