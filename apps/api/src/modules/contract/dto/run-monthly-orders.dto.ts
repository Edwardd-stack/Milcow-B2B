import { IsDateString, IsOptional } from 'class-validator';

export class RunMonthlyOrdersDto {
  /** Defaults to today (Korea time). @example "2026-12-01" */
  @IsOptional()
  @IsDateString({ strict: true })
  date?: string;
}
