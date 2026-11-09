import type { DeliveryType, OrderStatus } from '../enums';
import type { LocalizedText } from './common.type';

export interface OrderItemInfo {
  id: string;
  productId: string;
  productName: LocalizedText;
  itemTon: number;
  itemPricePerTon: number; // KRW, price at order time
  itemTotal: number; // KRW
}

/** POST /orders, GET /orders, GET /orders/:id */
export interface OrderInfo {
  id: string;
  orderStatus: OrderStatus;
  orderDeliveryType: DeliveryType;
  orderAddress: string | null;
  orderScheduledDate: string | null; // YYYY-MM-DD
  orderTotal: number; // KRW
  memberId: string;
  contractId: string | null;
  warehouse: { id: string; warehouseName: LocalizedText };
  items: OrderItemInfo[];
  createdAt: string;
}
