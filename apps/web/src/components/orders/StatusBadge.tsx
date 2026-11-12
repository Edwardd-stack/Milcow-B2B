'use client';

import { useTranslations } from 'next-intl';
import type { OrderStatus, PickupStatus } from '@milcow/shared';

const ORDER_STYLE: Record<OrderStatus, string> = {
  PENDING: 'bg-[#fff4e0] text-[#b86e00]',
  PAID: 'bg-brand/10 text-brand',
  PREPARING: 'bg-brand/10 text-brand',
  SHIPPING: 'bg-[#e8f1fb] text-[#1f5fa8]',
  READY_FOR_PICKUP: 'bg-[#e7f6ec] text-[#2f8f4e]',
  COMPLETED: 'bg-[#eef1f5] text-heading',
  CANCELLED: 'bg-[#fdecea] text-[#b42318]',
};

const PICKUP_STYLE: Record<PickupStatus, string> = {
  SCHEDULED: 'bg-brand/10 text-brand',
  LOADING: 'bg-[#fff4e0] text-[#b86e00]',
  READY: 'bg-[#e7f6ec] text-[#2f8f4e]',
  PICKED_UP: 'bg-[#eef1f5] text-heading',
};

const pill = 'inline-block shrink-0 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap';

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const t = useTranslations('Orders.status');
  return <span className={`${pill} ${ORDER_STYLE[status]}`}>{t(status)}</span>;
}

export function PickupStatusBadge({ status }: { status: PickupStatus }) {
  const t = useTranslations('Orders.pickupStatus');
  return <span className={`${pill} ${PICKUP_STYLE[status]}`}>{t(status)}</span>;
}
