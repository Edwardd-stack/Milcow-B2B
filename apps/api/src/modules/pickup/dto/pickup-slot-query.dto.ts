import { IsDateString, IsUUID } from 'class-validator';

export class PickupSlotQueryDto {
  @IsUUID()
  warehouseId: string;

  /** Korea date. @example "2026-11-12" */
  @IsDateString({ strict: true })
  date: string;
}
