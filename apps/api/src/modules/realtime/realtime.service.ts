import { Injectable } from '@nestjs/common';
import { RealtimeEvent, type OrderUpdatedPayload, type PickupUpdatedPayload } from '@milcow/shared';
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
}
