import type { DeliveryType, OrderStatus, PickupStatus } from '../enums';
import type { OrderCustomer, OrderEventInfo, OrderPaymentSummary } from './admin.type';
import type { LocalizedText } from './common.type';

export interface OrderItemInfo {
  id: string;
  productId: string;
  productName: LocalizedText;
  itemTon: number;
  itemPricePerTon: number; // KRW, price at order time
  itemTotal: number; // KRW
  lotCode: string | null; // milk lot → 원유 품질 여권
}

/** POST /orders, GET /orders, GET /orders/:id */
export interface OrderInfo {
  id: string;
  orderStatus: OrderStatus;
  orderDeliveryType: DeliveryType;
  orderAddress: string | null;
  orderScheduledDate: string | null; // YYYY-MM-DD
  orderServiceFee: number; // KRW, contract add-on services (0 for normal orders)
  orderTotal: number; // KRW, products + service fee
  memberId: string;
  contractId: string | null;
  warehouse: { id: string; warehouseName: LocalizedText };
  items: OrderItemInfo[];
  pickup: {
    id: string;
    pickupStatus: PickupStatus;
    pickupCode: string;
    slotStart: string;
  } | null; // PICKUP orders, after a time slot is booked
  orderHoldUntil: string | null; // surplus reservation: pay before this
  orderCancelReason: string | null; // why it was cancelled (shown to the buyer)
  createdAt: string;
  // GET /orders/:id for ADMIN / STAFF only
  customer?: OrderCustomer;
  payment?: OrderPaymentSummary | null;
  events?: OrderEventInfo[];
}
