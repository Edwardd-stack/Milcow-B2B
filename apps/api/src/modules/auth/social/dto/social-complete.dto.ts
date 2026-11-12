import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { Lang } from '@milcow/shared';

/** The company form after the first Kakao / Google login */
export class SocialCompleteDto {
  /** @example "(주)한빛유업" */
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  memberCompanyName: string;

  /** Prefilled from the provider, the user may edit it. @example "김민준" */
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  memberNick: string;

  /** Only needed when the provider gave no verified email. @example "buyer@company.co.kr" */
  @IsOptional()
  @IsEmail()
  memberEmail?: string;

  /** @example "123-45-67890" */
  @IsOptional()
  @Matches(/^\d{3}-\d{2}-\d{5}$/, { message: 'memberBizNo must look like 000-00-00000' })
  memberBizNo?: string;

  /** @example "010-1234-5678" */
  @IsOptional()
  @IsString()
  @MaxLength(20)
  memberPhone?: string;

  /** @example "KO" */
  @IsOptional()
  @IsIn(Object.values(Lang))
  memberLang?: Lang;
}
