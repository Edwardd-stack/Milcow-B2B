import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { ProductType } from '@milcow/shared';

export class SurplusQueryDto {
  @IsOptional()
  @IsIn(Object.values(ProductType))
  productType?: ProductType;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  /** price = cheapest first, expiring = least time left first (default) */
  @IsOptional()
  @IsIn(['price', 'expiring'])
  sort?: 'price' | 'expiring';
}
