import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Lang } from '@milcow/shared';

export class SignupDto {
  /** @example "buyer@company.co.kr" */
  @IsEmail()
  memberEmail: string;

  /** At least 8 characters. @example "Milcow1234!" */
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  memberPassword: string;

  /** @example "김민준" */
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  memberNick: string;

  /** @example "(주)한빛유업" */
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  memberCompanyName: string;

  /** 사업자등록번호, format 000-00-00000. @example "123-45-67890" */
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
