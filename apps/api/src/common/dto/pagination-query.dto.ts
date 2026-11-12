import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** ?page=1&limit=12 — extend this in every list query DTO */
export class PaginationQueryDto {
  /** @example 1 */
  @IsOptional()
  @Type(() => Number) // query strings are always text: "2" → 2
  @IsInt()
  @Min(1)
  page: number = 1;

  /** @example 12 */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 12;
}
