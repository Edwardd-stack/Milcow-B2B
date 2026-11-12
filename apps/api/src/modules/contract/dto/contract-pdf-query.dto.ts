import { IsIn, IsOptional } from 'class-validator';
import { LOCALES, type Locale } from '@milcow/shared';

export class ContractPdfQueryDto {
  /** Language of the document. @example "ko" */
  @IsOptional()
  @IsIn(LOCALES)
  locale: Locale = 'ko';
}
