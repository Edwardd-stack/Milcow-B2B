import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ProductGrade, ProductSort, ProductType } from '@milcow/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

/** "a,b" → ["a", "b"] (lists travel in the query string as comma-separated text) */
const toList = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.split(',').filter(Boolean) : value;

/**
 * GET /products?page=1&limit=6&productType=BUTTER&grades=PREMIUM,GRADE_1
 *   &warehouseIds=<uuid>,<uuid>&minPrice=1000000&maxPrice=9000000&inStock=true&q=버터&sort=PRICE_ASC
 */
export class ProductListQueryDto extends PaginationQueryDto {
  /** @example "RAW_MILK" */
  @IsOptional()
  @IsIn(Object.values(ProductType))
  productType?: ProductType;

  /** Comma-separated. @example "PREMIUM,GRADE_1" */
  @IsOptional()
  @Transform(toList)
  @IsIn(Object.values(ProductGrade), { each: true })
  grades?: ProductGrade[];

  /** Only products with stock in one of these warehouses. Comma-separated uuids. */
  @IsOptional()
  @Transform(toList)
  @IsUUID('all', { each: true })
  warehouseIds?: string[];

  /** KRW per ton. @example 1000000 */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  /** KRW per ton. @example 9000000 */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  /** Only products that are in stock somewhere. @example true */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  inStock?: boolean;

  /** Search in the product name (ko / en / uz, case-insensitive). @example "버터" */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  q?: string;

  /** Default: RECOMMENDED (by type, best grade first). @example "PRICE_ASC" */
  @IsOptional()
  @IsIn(Object.values(ProductSort))
  sort: ProductSort = ProductSort.RECOMMENDED;
}
