import type { AdminOrderRow, OrderInfo, OrderPaymentSummary } from '@milcow/shared';
import { DEMO_PAYMENT_KEY_PREFIX } from '@milcow/shared';
import type { Prisma } from '../../generated/prisma/client';
import { contactFor } from '../../common/policies/demo.policy';
import type { AuthMember } from '../../libs/types/auth.type';
import { toLocalizedText, toNumber } from '../../libs/utils/convert.util';
import { orderEventInclude, toOrderEventInfo } from './order-events';

export const orderInclude = {
  warehouse: true,
  items: { include: { product: true, lot: { select: { lotCode: true } } }, orderBy: { id: 'asc' } },
  pickup: { include: { pickupSlot: true } },
  // Only the latest cancel line — its note is the reason shown to the buyer
  events: {
    where: { eventType: 'CANCELLED' },
    orderBy: { createdAt: 'desc' },
    take: 1,
    select: { eventNote: true },
  },
} satisfies Prisma.OrderInclude;

/** Extra data for the admin / staff order drawer */
export const orderAdminInclude = {
  ...orderInclude,
  member: true,
  payments: { orderBy: { createdAt: 'desc' }, take: 1 },
  events: { include: orderEventInclude, orderBy: { createdAt: 'asc' } },
} satisfies Prisma.OrderInclude;

type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;
type OrderAdminRow = Prisma.OrderGetPayload<{ include: typeof orderAdminInclude }>;

export function toOrderInfo(order: OrderRow): OrderInfo {
  return {
    id: order.id,
    orderStatus: order.orderStatus,
    orderDeliveryType: order.orderDeliveryType,
    orderAddress: order.orderAddress,
    orderScheduledDate: order.orderScheduledDate?.toISOString().slice(0, 10) ?? null,
    orderServiceFee: toNumber(order.orderServiceFee),
    orderTotal: toNumber(order.orderTotal),
    memberId: order.memberId,
    contractId: order.contractId,
    warehouse: {
      id: order.warehouse.id,
      warehouseName: toLocalizedText(order.warehouse.warehouseName),
    },
    items: order.items.map((item) => {
      const itemTon = toNumber(item.itemTon);
      return {
        id: item.id,
        productId: item.productId,
        productName: toLocalizedText(item.product.productName),
        itemTon,
        itemPricePerTon: item.itemPricePerTon,
        itemTotal: Math.round(itemTon * item.itemPricePerTon),
        lotCode: item.lot?.lotCode ?? null,
      };
    }),
    pickup: order.pickup
      ? {
          id: order.pickup.id,
          pickupStatus: order.pickup.pickupStatus,
          pickupCode: order.pickup.pickupCode,
          slotStart: order.pickup.pickupSlot.slotStart.toISOString(),
        }
      : null,
    orderHoldUntil: order.orderHoldUntil?.toISOString() ?? null,
    orderCancelReason:
      order.orderStatus === 'CANCELLED' ? (order.events[0]?.eventNote ?? null) : null,
    createdAt: order.createdAt.toISOString(),
  };
}

/** Order + customer, last payment and the full history (masked for demo sessions) */
export function toOrderAdminInfo(viewer: AuthMember, order: OrderAdminRow): OrderInfo {
  const cancel = [...order.events].reverse().find((e) => e.eventType === 'CANCELLED');
  const base = toOrderInfo({ ...order, events: cancel ? [cancel] : [] });
  const payment = order.payments[0];
  return {
    ...base,
    customer: toCustomer(viewer, order.member),
    payment: payment ? toPaymentSummary(payment) : null,
    events: order.events.map(toOrderEventInfo),
  };
}

export function toPaymentSummary(payment: Prisma.PaymentGetPayload<object>): OrderPaymentSummary {
  return {
    paymentStatus: payment.paymentStatus,
    paymentMethod: payment.paymentMethod,
    paymentAmount: toNumber(payment.paymentAmount),
    paymentApprovedAt: payment.paymentApprovedAt?.toISOString() ?? null,
    isDemo: payment.paymentKey?.startsWith(DEMO_PAYMENT_KEY_PREFIX) ?? false,
  };
}

type CustomerRow = Pick<
  Prisma.MemberGetPayload<object>,
  'id' | 'memberCompanyName' | 'memberNick' | 'memberEmail' | 'memberPhone' | 'memberIsDemo'
>;

export function toCustomer(viewer: AuthMember, member: CustomerRow) {
  return contactFor(
    viewer,
    {
      id: member.id,
      companyName: member.memberCompanyName,
      nick: member.memberNick,
      email: member.memberEmail,
      phone: member.memberPhone,
      isDemo: member.memberIsDemo,
    },
    member.memberIsDemo,
  );
}

/** Admin table row */
export const orderRowInclude = {
  warehouse: true,
  member: true,
  items: { include: { product: true }, orderBy: { id: 'asc' } },
} satisfies Prisma.OrderInclude;

type OrderTableRow = Prisma.OrderGetPayload<{ include: typeof orderRowInclude }>;

export function toAdminOrderRow(viewer: AuthMember, order: OrderTableRow): AdminOrderRow {
  const [first, ...rest] = order.items;
  const name = first ? toLocalizedText(first.product.productName) : { ko: '-', en: '-', uz: '-' };
  const more = rest.length;
  return {
    id: order.id,
    orderStatus: order.orderStatus,
    orderDeliveryType: order.orderDeliveryType,
    orderTotal: toNumber(order.orderTotal),
    warehouseName: toLocalizedText(order.warehouse.warehouseName),
    customer: toCustomer(viewer, order.member),
    itemsLabel: more
      ? {
          ko: `${name.ko} 외 ${more}건`,
          en: `${name.en} +${more}`,
          uz: `${name.uz} +${more}`,
        }
      : name,
    totalTon: order.items.reduce((sum, i) => sum + toNumber(i.itemTon), 0),
    createdAt: order.createdAt.toISOString(),
  };
}
