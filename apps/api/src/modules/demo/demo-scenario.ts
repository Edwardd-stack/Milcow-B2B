import { randomInt, randomUUID } from 'node:crypto';
import type {
  DeliveryType,
  OrderStatus,
  PickupStatus,
  Prisma,
  PrismaClient,
  Product,
  ProductType,
} from '../../generated/prisma/client';
import { fromDateString, koreaToday, monthlyDates } from '../../libs/utils/date.util';
import { DEMO_ADDRESS } from './demo.constants';

/**
 * Demo history for one buyer: an order in every status, payments, pickups,
 * an ACTIVE contract with its monthly orders and a contract waiting for review.
 *
 * Dates are relative to "today", so the demo always looks fresh.
 * Re-runnable: the buyer's old orders / contracts are removed first (one transaction).
 * Used by the seed and by the nightly DemoService reset.
 */
export async function buildDemoScenario(prisma: PrismaClient, memberId: string): Promise<number> {
  const [products, warehouses, plans] = await Promise.all([
    prisma.product.findMany({ where: { productStatus: 'ACTIVE' }, orderBy: { createdAt: 'asc' } }),
    prisma.warehouse.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.servicePlan.findMany(),
  ]);
  if (products.length === 0 || warehouses.length === 0) {
    throw new Error('Demo scenario needs products and warehouses — run the seed first');
  }
  const pick = (type: ProductType) => products.find((p) => p.productType === type) ?? products[0]!;
  const main = warehouses[0]!; // length checked above
  const second = warehouses[1] ?? main;
  const plan = (type: string) => plans.find((p) => p.serviceType === type);

  return prisma.$transaction(
    async (tx) => {
      await clearBuyer(tx, memberId);
      const add = (spec: OrderSpec) => createOrder(tx, memberId, spec);

      // ── One-off orders: one in every status ──
      const singles: OrderSpec[] = [
        {
          status: 'PENDING',
          type: 'PICKUP',
          warehouseId: main.id,
          created: 0,
          scheduled: 3,
          items: [[pick('CREAM'), 2]],
        },
        {
          status: 'PAID',
          type: 'DELIVERY',
          warehouseId: main.id,
          created: 0,
          scheduled: 4,
          items: [
            [pick('BUTTER'), 1],
            [pick('CHEESE'), 1],
          ],
        },
        {
          status: 'PREPARING',
          type: 'PICKUP',
          warehouseId: second.id,
          created: -1,
          scheduled: 2,
          items: [[pick('MILK_POWDER'), 2]],
          pickup: { status: 'SCHEDULED', day: 2, hour: 14 },
        },
        {
          status: 'READY_FOR_PICKUP',
          type: 'PICKUP',
          warehouseId: main.id,
          created: -2,
          scheduled: 1,
          items: [[pick('RAW_MILK'), 10]],
          pickup: { status: 'READY', day: 1, hour: 10 },
        },
        {
          status: 'SHIPPING',
          type: 'DELIVERY',
          warehouseId: main.id,
          created: -3,
          scheduled: 0,
          items: [[pick('YOGURT'), 3]],
        },
        {
          status: 'COMPLETED',
          type: 'PICKUP',
          warehouseId: second.id,
          created: -16,
          scheduled: -14,
          items: [[pick('RAW_MILK'), 8]],
          pickup: { status: 'PICKED_UP', day: -14, hour: 9 },
        },
        {
          status: 'COMPLETED',
          type: 'DELIVERY',
          warehouseId: main.id,
          created: -25,
          scheduled: -22,
          items: [
            [pick('CREAM'), 3],
            [pick('BUTTER'), 1],
          ],
        },
        {
          status: 'CANCELLED',
          type: 'DELIVERY',
          warehouseId: main.id,
          created: -9,
          scheduled: -6,
          items: [[pick('CHEESE'), 2]],
          unpaid: true,
        },
      ];
      for (const spec of singles) await add(spec);

      // ── ACTIVE contract: started 2 months ago on the 5th, 12 monthly deliveries ──
      const milk = pick('RAW_MILK');
      const today = koreaToday();
      const [y, m] = today.split('-').map(Number) as [number, number];
      const startMonth = new Date(Date.UTC(y, m - 1 - 2, 5)).toISOString().slice(0, 10);
      const deliveries = monthlyDates(startMonth, '9999-12-31', 12);
      const services = [plan('COLD_CHAIN'), plan('QUALITY_TEST')].filter((p) => !!p);
      const fee = services.reduce((sum, s) => sum + s.servicePrice, 0);
      const monthlyTon = Math.max(10, milk.productMinOrderTon.toNumber());

      const active = await tx.contract.create({
        data: {
          memberId,
          productId: milk.id,
          warehouseId: main.id,
          contractStatus: 'ACTIVE',
          contractStart: fromDateString(deliveries[0]!),
          contractEnd: fromDateString(deliveries.at(-1)!),
          contractMonthlyTon: monthlyTon,
          contractPricePerTon: milk.productPricePerTon,
          contractDeliveryType: 'DELIVERY',
          contractAddress: DEMO_ADDRESS,
          createdAt: at(daysBetween(today, deliveries[0]!) - 10, 11),
          services: {
            create: services.map((s) => ({ servicePlanId: s.id, servicePrice: s.servicePrice })),
          },
        },
      });
      // The deliveries that are already due: older ones done, the latest one being prepared
      const due = deliveries.filter((d) => d <= today);
      for (const [i, date] of due.entries()) {
        const offset = daysBetween(today, date);
        await add({
          status: i === due.length - 1 ? 'PREPARING' : 'COMPLETED',
          type: 'DELIVERY',
          warehouseId: main.id,
          created: offset,
          scheduled: offset,
          items: [[milk, monthlyTon]],
          contractId: active.id,
          serviceFee: fee,
        });
      }

      // ── Contract waiting for Milcow's approval (the admin app approves it) ──
      const cream = pick('CREAM');
      const reviewStart = new Date(Date.UTC(y, m, 10)).toISOString().slice(0, 10); // next month, 10th
      const reviewDates = monthlyDates(reviewStart, '9999-12-31', 6);
      const lock = plan('PRICE_LOCK');
      await tx.contract.create({
        data: {
          memberId,
          productId: cream.id,
          warehouseId: second.id,
          contractStatus: 'REVIEW',
          contractStart: fromDateString(reviewDates[0]!),
          contractEnd: fromDateString(reviewDates.at(-1)!),
          contractMonthlyTon: Math.max(3, cream.productMinOrderTon.toNumber()),
          contractPricePerTon: cream.productPricePerTon,
          contractDeliveryType: 'PICKUP',
          services: lock
            ? { create: [{ servicePlanId: lock.id, servicePrice: lock.servicePrice }] }
            : undefined,
        },
      });

      return singles.length + due.length;
    },
    { timeout: 20_000 },
  );
}

// ── helpers ──

type Tx = Prisma.TransactionClient;

interface OrderSpec {
  status: OrderStatus;
  type: DeliveryType;
  warehouseId: string;
  created: number; // days from today
  scheduled: number;
  items: [Product, number][]; // product, tons (raised to the product's minimum)
  pickup?: { status: PickupStatus; day: number; hour: number };
  contractId?: string;
  serviceFee?: number;
  unpaid?: boolean; // PENDING is always unpaid
}

/** Removes the buyer's orders, payments, pickups and contracts (and frees the booked slots) */
async function clearBuyer(tx: Tx, memberId: string) {
  const pickups = await tx.pickup.findMany({ where: { order: { memberId } } });
  for (const p of pickups) {
    await tx.pickupSlot.update({
      where: { id: p.pickupSlotId },
      data: { slotBooked: { decrement: 1 } },
    });
  }
  await tx.payment.deleteMany({ where: { order: { memberId } } }); // Restrict → before orders
  await tx.order.deleteMany({ where: { memberId } }); // items + pickup cascade
  await tx.contract.deleteMany({ where: { memberId } }); // contract services cascade
}

async function createOrder(tx: Tx, memberId: string, spec: OrderSpec) {
  const lines = spec.items.map(([product, ton]) => ({
    product,
    ton: Math.max(ton, product.productMinOrderTon.toNumber()),
  }));
  const fee = spec.serviceFee ?? 0;
  const total =
    lines.reduce((sum, l) => sum + Math.round(l.ton * l.product.productPricePerTon), 0) + fee;
  const createdAt = at(spec.created, 10);

  // Fresh products: link each line to a milk lot milked before the order (원유 품질 여권)
  const lotIds = await Promise.all(
    lines.map(async (l) => {
      const lot = await tx.lot.findFirst({
        where: { productId: l.product.id, lotMilkedAt: { lte: createdAt } },
        orderBy: { lotMilkedAt: 'desc' },
        select: { id: true },
      });
      return lot?.id ?? null;
    }),
  );

  const order = await tx.order.create({
    data: {
      memberId,
      warehouseId: spec.warehouseId,
      contractId: spec.contractId,
      orderStatus: spec.status,
      orderDeliveryType: spec.type,
      orderAddress: spec.type === 'DELIVERY' ? DEMO_ADDRESS : null,
      orderScheduledDate: fromDateString(day(spec.scheduled)),
      orderServiceFee: fee,
      orderTotal: total,
      createdAt,
      items: {
        create: lines.map((l, i) => ({
          productId: l.product.id,
          itemTon: l.ton,
          itemPricePerTon: l.product.productPricePerTon,
          lotId: lotIds[i],
        })),
      },
    },
  });

  // Order history: created → … → current status, a few hours apart
  const path = statusPath(spec.status, spec.type);
  await tx.orderEvent.createMany({
    data: path.map((to, i) => ({
      orderId: order.id,
      eventType: i === 0 ? 'CREATED' : to === 'CANCELLED' ? 'CANCELLED' : 'STATUS_CHANGED',
      eventFrom: i === 0 ? null : path[i - 1],
      eventTo: to,
      eventNote: to === 'CANCELLED' ? '고객 요청으로 취소' : null,
      createdAt: new Date(createdAt.getTime() + i * 3 * 60 * 60_000 + (i > 0 ? 3 * 60_000 : 0)),
    })),
  });

  if (spec.status !== 'PENDING' && !spec.unpaid) {
    await tx.payment.create({
      data: {
        orderId: order.id,
        paymentTossOrderId: `MC-DEMO-${randomUUID()}`,
        paymentKey: `demo_${randomUUID()}`,
        paymentStatus: 'DONE',
        paymentMethod: '카드',
        paymentAmount: total,
        paymentApprovedAt: new Date(createdAt.getTime() + 3 * 60_000),
      },
    });
  }

  if (spec.pickup) {
    const slotStart = at(spec.pickup.day, spec.pickup.hour);
    // Past slots don't exist any more → create; future ones → book a place
    const slot = await tx.pickupSlot.upsert({
      where: { warehouseId_slotStart: { warehouseId: spec.warehouseId, slotStart } },
      create: {
        warehouseId: spec.warehouseId,
        slotStart,
        slotEnd: new Date(slotStart.getTime() + 60 * 60_000),
        slotCapacity: 3,
        slotBooked: 1,
      },
      update: { slotBooked: { increment: 1 } },
    });
    await tx.pickup.create({
      data: {
        orderId: order.id,
        pickupSlotId: slot.id,
        pickupStatus: spec.pickup.status,
        pickupCode: `MC-${code()}`,
        pickupVehicleNo: spec.pickup.status === 'SCHEDULED' ? null : '12가 3456',
      },
    });
  }
}

/** The statuses an order went through to reach `status` */
function statusPath(status: OrderStatus, type: DeliveryType): OrderStatus[] {
  if (status === 'CANCELLED') return ['PENDING', 'CANCELLED'];
  const full: OrderStatus[] = [
    'PENDING',
    'PAID',
    'PREPARING',
    type === 'PICKUP' ? 'READY_FOR_PICKUP' : 'SHIPPING',
    'COMPLETED',
  ];
  return full.slice(0, full.indexOf(status) + 1);
}

const DAY_MS = 24 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, '0');

/** Korea date `offset` days from today → "YYYY-MM-DD" */
function day(offset: number): string {
  return new Date(fromDateString(koreaToday()).getTime() + offset * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/** Korea date + hour → the exact moment (UTC Date) */
function at(offset: number, hour: number): Date {
  return new Date(`${day(offset)}T${pad(hour)}:00:00.000+09:00`);
}

/** "YYYY-MM-DD" − today, in days (negative = past) */
function daysBetween(today: string, date: string): number {
  return Math.round((fromDateString(date).getTime() - fromDateString(today).getTime()) / DAY_MS);
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I
function code(): string {
  let out = '';
  for (let i = 0; i < 6; i++) out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return out;
}
