import { IsIn, IsOptional } from 'class-validator';
import { ProductSort, ProductType } from '@milcow/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

/** GET /products?page=1&limit=12&productType=RAW_MILK&sort=PRICE_ASC */
export class ProductListQueryDto extends PaginationQueryDto {
  /** @example "RAW_MILK" */
  @IsOptional()
  @IsIn(Object.values(ProductType))
  productType?: ProductType;

  /** @example "PRICE_ASC" */
  @IsOptional()
  @IsIn(Object.values(ProductSort))
  sort: ProductSort = ProductSort.NEWEST;
}
