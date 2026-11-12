import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
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
  ValidateNested,
} from 'class-validator';
import { DeliveryType } from '@milcow/shared';
import { MAX_ITEMS_PER_ORDER } from '../order.constants';

export class CreateOrderItemDto {
  @IsUUID()
  productId: string;

  /** Tons, up to 2 decimals. @example 20 */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  itemTon: number;
}

export class CreateOrderDto {
  /** Warehouse the order ships from / is picked up at */
  @IsUUID()
  warehouseId: string;

  /** @example "PICKUP" */
  @IsIn(Object.values(DeliveryType))
  orderDeliveryType: DeliveryType;

  /** Required when orderDeliveryType is DELIVERY. @example "서울특별시 성동구 성수이로 1" */
  @ValidateIf((dto: CreateOrderDto) => dto.orderDeliveryType === 'DELIVERY')
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  orderAddress?: string;

  /** @example "2026-11-20" */
  @IsOptional()
  @IsDateString({ strict: true })
  orderScheduledDate?: string;

  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_ITEMS_PER_ORDER)
  items: CreateOrderItemDto[];
}
