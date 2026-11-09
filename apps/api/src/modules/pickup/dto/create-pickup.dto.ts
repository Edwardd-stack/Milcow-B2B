import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreatePickupDto {
  /** A PICKUP order of the buyer */
  @IsUUID()
  orderId: string;

  /** From GET /pickup-slots — must be at the order's warehouse */
  @IsUUID()
  pickupSlotId: string;

  /** Truck plate number. @example "12가 3456" */
  @IsOptional()
  @IsString()
  @MaxLength(20)
  pickupVehicleNo?: string;
}
