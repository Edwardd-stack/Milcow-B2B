import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { LOCALES, type Locale } from '@milcow/shared';

export class CopilotDto {
  /** @example "이번 달 매출을 상품별로 보여줘" */
  @IsString()
  @MinLength(2)
  @MaxLength(300)
  question: string;

  @IsIn(LOCALES)
  locale: Locale;
}
