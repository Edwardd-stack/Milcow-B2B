import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { LOCALES, type Locale } from '@milcow/shared';

export class ContractDraftRequestDto {
  /** What the buyer needs, in their own words. @example "매달 20톤 원유, 이천 창고에서 픽업, 내년 1월부터 6개월, 품질 검사 포함" */
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  request: string;

  /** Language of the explanation. @example "ko" */
  @IsIn(LOCALES)
  locale: Locale;
}
