import { IsIn } from 'class-validator';
import { OrderStatus } from '@milcow/shared';

export class UpdateOrderStatusDto {
  /** @example "PREPARING" */
  @IsIn(Object.values(OrderStatus))
  orderStatus: OrderStatus;
}
