import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { AuthResponse, MemberInfo } from '@milcow/shared';
import { OptionalMember } from '../../common/decorators/optional-member.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { AuthMember } from '../../libs/types/auth.type';
import { AUTH_COOKIE, authCookieOptions } from '../../libs/utils/auth-cookie.util';
import { AuthService, type AuthResult } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Create a buyer (company) account — sets the auth cookie' })
  async signup(
    @Body() input: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    return this.withCookie(res, await this.authService.signup(input));
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email and password — sets the auth cookie' })
  async login(
    @Body() input: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    return this.withCookie(res, await this.authService.login(input));
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Log out — clears the auth cookie' })
  logout(@Res({ passthrough: true }) res: Response): void {
    // Same options as when it was set (except maxAge), otherwise the browser keeps it
    const options = this.cookieOptions();
    delete options.maxAge;
    res.clearCookie(AUTH_COOKIE, options);
  }

  /**
   * Public on purpose: a guest gets `null` (200), not 401.
   * The web app asks this on every page load — guests are normal, not an error.
   */
  @Public()
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'The logged-in member, or null for a guest' })
  async me(
    @OptionalMember() member: AuthMember | undefined,
  ): Promise<{ member: MemberInfo | null }> {
    return { member: member ? await this.authService.me(member.id) : null };
  }

  /** passthrough: true → Nest still sends our return value as JSON, we only add the cookie */
  private withCookie(res: Response, { accessToken, member }: AuthResult): AuthResponse {
    res.cookie(AUTH_COOKIE, accessToken, this.cookieOptions());
    return { member };
  }

  private cookieOptions() {
    return authCookieOptions(
      this.config.getOrThrow<number>('JWT_EXPIRES_IN_SEC'),
      this.config.get<string>('NODE_ENV') === 'production',
    );
  }
}
