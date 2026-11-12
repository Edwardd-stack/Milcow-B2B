import type { OrderInfo } from '@milcow/shared';
import type { Prisma } from '../../generated/prisma/client';
import { toLocalizedText, toNumber } from '../../libs/utils/convert.util';

export const orderInclude = {
  warehouse: true,
  items: { include: { product: true, lot: { select: { lotCode: true } } }, orderBy: { id: 'asc' } },
  pickup: { include: { pickupSlot: true } },
} satisfies Prisma.OrderInclude;

type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

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
    createdAt: order.createdAt.toISOString(),
  };
}
