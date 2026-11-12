import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { DeliveryType } from '@milcow/shared';

export class CreateContractDto {
  @IsUUID()
  productId: string;

  @IsUUID()
  warehouseId: string;

  /** First delivery date; deliveries repeat on this day every month. @example "2026-12-01" */
  @IsDateString({ strict: true })
  contractStart: string;

  /** @example "2027-05-31" */
  @IsDateString({ strict: true })
  contractEnd: string;

  /** @example 20 */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  contractMonthlyTon: number;

  /** @example "DELIVERY" */
  @IsIn(Object.values(DeliveryType))
  contractDeliveryType: DeliveryType;

  /** Required when contractDeliveryType is DELIVERY. @example "경기도 화성시 동탄대로 1" */
  @ValidateIf((dto: CreateContractDto) => dto.contractDeliveryType === 'DELIVERY')
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  contractAddress?: string;

  /** Add-on services (ids from GET /service-plans) */
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(10)
  @IsUUID('all', { each: true })
  servicePlanIds: string[] = [];
}
