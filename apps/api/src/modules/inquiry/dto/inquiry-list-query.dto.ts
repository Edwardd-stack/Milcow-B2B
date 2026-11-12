import { IsIn, IsOptional } from 'class-validator';
import { InquiryStatus } from '@milcow/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class InquiryListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(Object.values(InquiryStatus))
  inquiryStatus?: InquiryStatus;
}
