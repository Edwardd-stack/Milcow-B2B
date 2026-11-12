import { Injectable } from '@nestjs/common';
import {
  COPILOT_MAX_ROWS,
  type AdminStats,
  type ContractPipeline,
  type CopilotGroupBy,
  type LocalizedText,
} from '@milcow/shared';
import { Prisma } from '../../generated/prisma/client';
import { contactFor } from '../../common/policies/demo.policy';
import { PrismaService } from '../../libs/prisma/prisma.service';
import type { AuthMember } from '../../libs/types/auth.type';
import { toLocalizedText } from '../../libs/utils/convert.util';
import { koreaDayRange, koreaToday } from '../../libs/utils/date.util';
import { orderRowInclude, toAdminOrderRow } from '../order/order.mapper';
import { DASHBOARD_DAYS, LOW_STOCK_TON } from './admin.constants';

/** "Sales" everywhere = payments that went through (DONE) — refunded ones become CANCELED */
const DONE = Prisma.sql`pay.payment_status = 'DONE'`;

export interface SalesRow {
  key: string;
  label: LocalizedText;
  orders: number;
  ton: number;
  revenue: number;
}

export interface CustomerRow {
  company: string;
  email: string;
  orders: number;
  revenue: number;
}

export interface LowStockRow {
  productId: string;
  productName: LocalizedText;
  warehouseName: LocalizedText;
  ton: number;
}

/**
 * Read-only numbers for the dashboard and the ops copilot.
 * Every query is fixed here (parameters are bound, never pasted into SQL).
 */
@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async stats(viewer: AuthMember): Promise<AdminStats> {
    const today = koreaToday();
    const todayRange = koreaDayRange(today);
    const monthStart = koreaDayRange(`${today.slice(0, 7)}-01`).gte;
    const chartStart = new Date(todayRange.gte.getTime() - (DASHBOARD_DAYS - 1) * 86_400_000);

    const [todayOrders, todayPaid, monthPaid, contractsInReview, newInquiries, lowStock, recent] =
      await Promise.all([
        this.prisma.order.count({ where: { createdAt: todayRange } }),
        this.prisma.payment.aggregate({
          where: { paymentStatus: 'DONE', paymentApprovedAt: todayRange },
          _sum: { paymentAmount: true },
        }),
        this.prisma.payment.aggregate({
          where: { paymentStatus: 'DONE', paymentApprovedAt: { gte: monthStart } },
          _sum: { paymentAmount: true },
          _count: true,
        }),
        this.prisma.contract.count({ where: { contractStatus: 'REVIEW' } }),
        this.prisma.inquiry.count({ where: { inquiryStatus: 'NEW' } }),
        this.lowStock(LOW_STOCK_TON, 6),
        this.prisma.order.findMany({
          include: orderRowInclude,
          orderBy: { createdAt: 'desc' },
          take: 8,
        }),
      ]);

    const daily = await this.prisma.$queryRaw<{ day: string; revenue: number; orders: number }[]>`
      SELECT to_char((pay.payment_approved_at AT TIME ZONE 'Asia/Seoul')::date, 'YYYY-MM-DD') AS day,
             SUM(pay.payment_amount)::float8 AS revenue,
             COUNT(*)::int AS orders
      FROM payments pay
      WHERE ${DONE} AND pay.payment_approved_at >= ${chartStart}
      GROUP BY 1`;
    const byDay = new Map(daily.map((d) => [d.day, d]));

    return {
      today: { orders: todayOrders, revenue: todayPaid._sum.paymentAmount?.toNumber() ?? 0 },
      month: {
        revenue: monthPaid._sum.paymentAmount?.toNumber() ?? 0,
        orders: monthPaid._count,
      },
      daily: Array.from({ length: DASHBOARD_DAYS }, (_, i) => {
        const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(
          new Date(chartStart.getTime() + i * 86_400_000 + 12 * 3_600_000),
        );
        const row = byDay.get(date);
        return { date, revenue: row?.revenue ?? 0, orders: row?.orders ?? 0 };
      }),
      contractsInReview,
      newInquiries,
      lowStock,
      recentOrders: recent.map((order) => toAdminOrderRow(viewer, order)),
    };
  }

  /** Sales in [from, to] (Korean dates, inclusive) grouped by product / customer / warehouse / day */
  async salesSummary(
    viewer: AuthMember,
    from: string,
    to: string,
    groupBy: CopilotGroupBy,
  ): Promise<SalesRow[]> {
    const gte = koreaDayRange(from).gte;
    const lt = koreaDayRange(to).lt;
    const inRange = Prisma.sql`${DONE} AND pay.payment_approved_at >= ${gte} AND pay.payment_approved_at < ${lt}`;

    if (groupBy === 'product') {
      const rows = await this.prisma.$queryRaw<
        { key: string; name: Prisma.JsonValue; orders: number; ton: number; revenue: number }[]
      >`
        SELECT p.id::text AS key, p.product_name AS name,
               COUNT(DISTINCT o.id)::int AS orders,
               SUM(oi.item_ton)::float8 AS ton,
               SUM(ROUND(oi.item_ton * oi.item_price_per_ton))::float8 AS revenue
        FROM payments pay
        JOIN orders o ON o.id = pay.order_id
        JOIN order_items oi ON oi.order_id = o.id
        JOIN products p ON p.id = oi.product_id
        WHERE ${inRange}
        GROUP BY p.id ORDER BY revenue DESC LIMIT ${COPILOT_MAX_ROWS}`;
      return rows.map((r) => ({ ...r, label: toLocalizedText(r.name) }));
    }

    // One row per paid order (amount + tons), then grouped
    const paid = Prisma.sql`
      SELECT o.id, o.warehouse_id, pay.payment_amount AS amount, pay.payment_approved_at AS paid_at,
             (SELECT SUM(oi.item_ton) FROM order_items oi WHERE oi.order_id = o.id) AS ton
      FROM payments pay JOIN orders o ON o.id = pay.order_id
      WHERE ${inRange}`;

    if (groupBy === 'warehouse') {
      const rows = await this.prisma.$queryRaw<
        { key: string; name: Prisma.JsonValue; orders: number; ton: number; revenue: number }[]
      >`
        WITH paid AS (${paid})
        SELECT w.id::text AS key, w.warehouse_name AS name, COUNT(*)::int AS orders,
               SUM(paid.ton)::float8 AS ton, SUM(paid.amount)::float8 AS revenue
        FROM paid JOIN warehouses w ON w.id = paid.warehouse_id
        GROUP BY w.id ORDER BY revenue DESC LIMIT ${COPILOT_MAX_ROWS}`;
      return rows.map((r) => ({ ...r, label: toLocalizedText(r.name) }));
    }

    if (groupBy === 'day') {
      const rows = await this.prisma.$queryRaw<
        { key: string; orders: number; ton: number; revenue: number }[]
      >`
        WITH paid AS (${paid})
        SELECT to_char((paid.paid_at AT TIME ZONE 'Asia/Seoul')::date, 'YYYY-MM-DD') AS key,
               COUNT(*)::int AS orders, SUM(paid.ton)::float8 AS ton,
               SUM(paid.amount)::float8 AS revenue
        FROM paid GROUP BY 1 ORDER BY 1 LIMIT ${COPILOT_MAX_ROWS}`;
      return rows.map((r) => ({ ...r, label: { ko: r.key, en: r.key, uz: r.key } }));
    }

    // customer
    const customers = await this.topCustomers(viewer, from, to, COPILOT_MAX_ROWS);
    return customers.map((c) => ({
      key: c.email,
      label: { ko: c.company, en: c.company, uz: c.company },
      orders: c.orders,
      ton: 0,
      revenue: c.revenue,
    }));
  }

  /** Biggest buyers by paid amount (contact data masked for demo sessions) */
  async topCustomers(
    viewer: AuthMember,
    from: string,
    to: string,
    limit: number,
  ): Promise<CustomerRow[]> {
    const gte = koreaDayRange(from).gte;
    const lt = koreaDayRange(to).lt;
    const rows = await this.prisma.$queryRaw<
      { company: string; email: string; is_demo: boolean; orders: number; revenue: number }[]
    >`
      SELECT COALESCE(m.member_company_name, m.member_nick) AS company,
             m.member_email AS email, m.member_is_demo AS is_demo,
             COUNT(*)::int AS orders, SUM(pay.payment_amount)::float8 AS revenue
      FROM payments pay
      JOIN orders o ON o.id = pay.order_id
      JOIN members m ON m.id = o.member_id
      WHERE ${DONE} AND pay.payment_approved_at >= ${gte} AND pay.payment_approved_at < ${lt}
      GROUP BY m.id ORDER BY revenue DESC LIMIT ${Math.min(limit, COPILOT_MAX_ROWS)}`;
    return rows.map((r) => ({
      company: r.company,
      email: contactFor(viewer, { email: r.email, phone: null }, r.is_demo).email,
      orders: r.orders,
      revenue: r.revenue,
    }));
  }

  /** Warehouse stock below the threshold for products that are on sale */
  async lowStock(thresholdTon: number, take: number = COPILOT_MAX_ROWS): Promise<LowStockRow[]> {
    const rows = await this.prisma.inventory.findMany({
      where: { inventoryTon: { lt: thresholdTon }, product: { productStatus: 'ACTIVE' } },
      include: { product: true, warehouse: true },
      orderBy: { inventoryTon: 'asc' },
      take,
    });
    return rows.map((row) => ({
      productId: row.productId,
      productName: toLocalizedText(row.product.productName),
      warehouseName: toLocalizedText(row.warehouse.warehouseName),
      ton: row.inventoryTon.toNumber(),
    }));
  }

  /** How many contracts are in each status */
  async contractPipeline(): Promise<ContractPipeline> {
    const groups = await this.prisma.contract.groupBy({
      by: ['contractStatus'],
      _count: { _all: true },
    });
    const pipeline: ContractPipeline = { DRAFT: 0, REVIEW: 0, ACTIVE: 0, ENDED: 0, CANCELLED: 0 };
    for (const g of groups) pipeline[g.contractStatus] = g._count._all;
    return pipeline;
  }
}
