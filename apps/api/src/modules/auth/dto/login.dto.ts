import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  /** @example "buyer@milcow.test" */
  @IsEmail()
  memberEmail: string;

  /** @example "Milcow1234!" */
  @IsString()
  @MinLength(1)
  memberPassword: string;
}
