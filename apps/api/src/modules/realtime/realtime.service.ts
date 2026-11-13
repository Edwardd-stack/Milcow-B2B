import { Injectable } from '@nestjs/common';
import {
  RealtimeEvent,
  type ContractSubmittedPayload,
  type InquiryCreatedPayload,
  type OrderCreatedPayload,
  type OrderUpdatedPayload,
  type PickupUpdatedPayload,
} from '@milcow/shared';
import { RealtimeGateway } from './realtime.gateway';
import { ADMIN_ROOM, memberRoom, warehouseRoom } from './realtime.rooms';

/** Other services call this to push changes to the right people. */
@Injectable()
export class RealtimeService {
  constructor(private readonly gateway: RealtimeGateway) {}

  /** → the buyer who owns the order, the warehouse staff and admins */
  pickupUpdated(pickup: PickupUpdatedPayload, memberId: string) {
    this.gateway.server
      .to([memberRoom(memberId), warehouseRoom(pickup.warehouse.id), ADMIN_ROOM])
      .emit(RealtimeEvent.PICKUP_UPDATED, pickup);
  }

  orderUpdated(payload: OrderUpdatedPayload, memberId: string, warehouseId: string) {
    this.gateway.server
      .to([memberRoom(memberId), warehouseRoom(warehouseId), ADMIN_ROOM])
      .emit(RealtimeEvent.ORDER_UPDATED, payload);
  }

  /** New order → admins (dashboard toast) and the warehouse that will ship it */
  orderCreated(payload: OrderCreatedPayload, warehouseId: string) {
    this.gateway.server
      .to([warehouseRoom(warehouseId), ADMIN_ROOM])
      .emit(RealtimeEvent.ORDER_CREATED, payload);
  }

  inquiryCreated(payload: InquiryCreatedPayload) {
    this.gateway.server.to(ADMIN_ROOM).emit(RealtimeEvent.INQUIRY_CREATED, payload);
  }

  contractSubmitted(payload: ContractSubmittedPayload) {
    this.gateway.server.to(ADMIN_ROOM).emit(RealtimeEvent.CONTRACT_SUBMITTED, payload);
  }
}
