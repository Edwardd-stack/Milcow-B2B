import { IsIn, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import { DeliveryType, OrderStatus } from '@milcow/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class OrderListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(Object.values(OrderStatus))
  orderStatus?: OrderStatus;

  // ── Admin / staff filters (ignored for buyers' own lists only by being optional) ──

  @IsOptional()
  @IsIn(Object.values(DeliveryType))
  orderDeliveryType?: DeliveryType;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  /** Created on/after this Korean date (YYYY-MM-DD) */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;

  /** Created on/before this Korean date (YYYY-MM-DD) */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;

  /** Company name, buyer nick or the start of the order id */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  q?: string;
}
