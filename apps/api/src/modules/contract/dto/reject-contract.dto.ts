import { IsString, MaxLength, MinLength } from 'class-validator';

export class RejectContractDto {
  /** @example "요청하신 월 물량을 해당 창고에서 보장하기 어렵습니다." */
  @IsString()
  @MinLength(2)
  @MaxLength(300)
  reason: string;
}
