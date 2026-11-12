import { IsIn, IsOptional } from 'class-validator';
import { ContractStatus } from '@milcow/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ContractListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(Object.values(ContractStatus))
  contractStatus?: ContractStatus;
}
