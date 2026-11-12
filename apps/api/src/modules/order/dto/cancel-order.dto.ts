import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelOrderDto {
  /** @example "고객 요청으로 취소" */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
