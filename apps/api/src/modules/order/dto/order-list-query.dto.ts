import { IsIn, IsOptional } from 'class-validator';
import { OrderStatus } from '@milcow/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class OrderListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(Object.values(OrderStatus))
  orderStatus?: OrderStatus;
}
