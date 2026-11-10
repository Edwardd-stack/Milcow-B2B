import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  ParseEnumPipe,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import type { AuthResponse, SocialPendingInfo, SocialProvider } from '@milcow/shared';
import { Public } from '../../../common/decorators/public.decorator';
import { readCookie } from '../../../libs/utils/auth-cookie.util';
import { AuthCookieService } from '../auth-cookie.service';
import { SocialCompleteDto } from './dto/social-complete.dto';
import {
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_TTL_SEC,
  SOCIAL_PENDING_COOKIE,
  SOCIAL_PENDING_TTL_SEC,
  SocialAuthService,
} from './social-auth.service';

const PROVIDERS = { kakao: 'kakao', google: 'google' } as const;
const LOCALES = ['ko', 'en', 'uz'];

/** Only paths on our own site ("/ko/contracts"), never "//evil.com" or "https://…" (open redirect) */
function safeNext(next: unknown): string {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : '/ko';
}

/** "/en/contracts" → "en" */
function localeOf(path: string) {
  const first = path.split('/')[1] ?? '';
  return LOCALES.includes(first) ? first : 'ko';
}

@ApiTags('Auth')
@Public()
@Controller('auth')
export class SocialAuthController {
  private readonly logger = new Logger(SocialAuthController.name);

  constructor(
    private readonly social: SocialAuthService,
    private readonly cookies: AuthCookieService,
  ) {}

  @Get('social/pending')
  @ApiOperation({ summary: 'Social login waiting for the company form (null if none)' })
  async pending(@Req() req: Request): Promise<{ pending: SocialPendingInfo | null }> {
    return {
      pending: await this.social.readPending(readCookie(req.headers.cookie, SOCIAL_PENDING_COOKIE)),
    };
  }

  @Post('social/complete')
  @ApiOperation({
    summary: 'Finish the first social login — creates the buyer, sets the auth cookie',
  })
  async complete(
    @Req() req: Request,
    @Body() input: SocialCompleteDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse & { next: string }> {
    const { auth, next } = await this.social.complete(
      readCookie(req.headers.cookie, SOCIAL_PENDING_COOKIE),
      input,
    );
    this.cookies.clear(res, SOCIAL_PENDING_COOKIE);
    this.cookies.setAuth(res, auth.accessToken);
    return { member: auth.member, next };
  }

  @Get(':provider/start')
  @ApiOperation({ summary: 'Redirects to the Kakao / Google login page' })
  async start(
    @Param('provider', new ParseEnumPipe(PROVIDERS)) provider: SocialProvider,
    @Query('next') next: string | undefined,
    @Res() res: Response,
  ) {
    const target = safeNext(next);
    try {
      const { stateToken, url } = await this.social.start(provider, target);
      this.cookies.set(res, OAUTH_STATE_COOKIE, stateToken, OAUTH_STATE_TTL_SEC);
      res.redirect(url);
    } catch (error) {
      this.fail(res, target, provider, error);
    }
  }

  @Get(':provider/callback')
  @ApiOperation({ summary: 'Kakao / Google send the user back here with ?code=' })
  async callback(
    @Param('provider', new ParseEnumPipe(PROVIDERS)) provider: SocialProvider,
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const stateToken = readCookie(req.headers.cookie, OAUTH_STATE_COOKIE);
    this.cookies.clear(res, OAUTH_STATE_COOKIE); // one-time use
    const web = this.social.webOrigin();

    // The user pressed "cancel" at Kakao / Google
    if (!code || !state) return res.redirect(`${web}/ko/login?error=social`);

    try {
      const result = await this.social.callback(provider, code, state, stateToken);
      if (result.kind === 'loggedIn') {
        this.cookies.setAuth(res, result.auth.accessToken);
        return res.redirect(`${web}${result.next}`);
      }
      // New user → company form
      const token = await this.social.pendingToken(result.pending);
      this.cookies.set(res, SOCIAL_PENDING_COOKIE, token, SOCIAL_PENDING_TTL_SEC);
      return res.redirect(`${web}/${localeOf(result.pending.next)}/signup/complete`);
    } catch (error) {
      this.fail(res, '/ko', provider, error);
    }
  }

  /** Redirects never end on a JSON error page — back to /login with a message */
  private fail(res: Response, next: string, provider: SocialProvider, error: unknown) {
    this.logger.warn(
      `${provider} login failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    res.redirect(`${this.social.webOrigin()}/${localeOf(next)}/login?error=social`);
  }
}
