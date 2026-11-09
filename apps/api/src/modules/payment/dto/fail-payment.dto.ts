import { IsOptional, IsString, MaxLength } from 'class-validator';

/** The values Toss puts into the failUrl query string */
export class FailPaymentDto {
  @IsString()
  @MaxLength(64)
  tossOrderId: string;

  /** e.g. "PAY_PROCESS_CANCELED" */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
