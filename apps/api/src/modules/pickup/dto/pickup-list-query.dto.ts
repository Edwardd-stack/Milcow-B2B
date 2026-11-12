import { IsDateString, IsIn, IsOptional } from 'class-validator';
import { PickupStatus } from '@milcow/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class PickupListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(Object.values(PickupStatus))
  pickupStatus?: PickupStatus;

  /** Korea date of the slot. @example "2026-11-12" */
  @IsOptional()
  @IsDateString({ strict: true })
  date?: string;
}
