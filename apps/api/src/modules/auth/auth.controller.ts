import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import type { AuthResponse, MemberInfo, SocketTokenResponse } from '@milcow/shared';
import { CurrentMember } from '../../common/decorators/current-member.decorator';
import { OptionalMember } from '../../common/decorators/optional-member.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { AuthMember } from '../../libs/types/auth.type';
import { AuthCookieService } from './auth-cookie.service';
import { AuthService, type AuthResult } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookies: AuthCookieService,
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
    this.cookies.clearAuth(res);
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

  @Get('socket-token')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Short-lived token + URL for the realtime socket' })
  async socketToken(@CurrentMember() member: AuthMember): Promise<SocketTokenResponse> {
    return {
      token: await this.authService.socketToken(member),
      // Render sets RENDER_EXTERNAL_URL; locally the web app talks to the same origin
      url: this.config.get<string>('RENDER_EXTERNAL_URL') ?? null,
    };
  }

  /** passthrough: true → Nest still sends our return value as JSON, we only add the cookie */
  private withCookie(res: Response, { accessToken, member }: AuthResult): AuthResponse {
    this.cookies.setAuth(res, accessToken);
    return { member };
  }
}
