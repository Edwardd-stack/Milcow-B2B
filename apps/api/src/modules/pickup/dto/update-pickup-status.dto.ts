import { IsIn } from 'class-validator';
import { PickupStatus } from '@milcow/shared';

export class UpdatePickupStatusDto {
  /** @example "LOADING" */
  @IsIn(Object.values(PickupStatus))
  pickupStatus: PickupStatus;
}
