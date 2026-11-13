import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ProductGrade, ProductStatus, ProductType } from '@milcow/shared';

export class LocalizedTextDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  ko: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  en: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  uz: string;
}

export class LocalizedLongTextDto {
  @IsString()
  @MaxLength(2000)
  ko: string;

  @IsString()
  @MaxLength(2000)
  en: string;

  @IsString()
  @MaxLength(2000)
  uz: string;
}

export class StockInputDto {
  @IsUUID()
  warehouseId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100_000)
  inventoryTon: number;
}

/** POST /admin/products, PATCH /admin/products/:id (full form) */
export class ProductAdminDto {
  @IsIn(Object.values(ProductType))
  productType: ProductType;

  @IsIn(Object.values(ProductGrade))
  productGrade: ProductGrade;

  @IsIn(Object.values(ProductStatus))
  productStatus: ProductStatus;

  @ValidateNested()
  @Type(() => LocalizedTextDto)
  productName: LocalizedTextDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedLongTextDto)
  productDesc?: LocalizedLongTextDto | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99)
  productFatPct?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99)
  productProteinPct?: number | null;

  /** KRW per ton */
  @IsInt()
  @Min(1_000)
  @Max(1_000_000_000)
  productPricePerTon: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  @Max(10_000)
  productMinOrderTon: number;

  @ValidateNested({ each: true })
  @Type(() => StockInputDto)
  @ArrayMaxSize(20)
  stock: StockInputDto[];
}

/** PATCH /admin/products/:id/status — the quick toggle in the list */
export class ProductStatusDto {
  @IsIn(Object.values(ProductStatus))
  productStatus: ProductStatus;
}
