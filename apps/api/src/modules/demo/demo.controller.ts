import { Body, Controller, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import type { AuthResponse } from '@milcow/shared';
import { Public } from '../../common/decorators/public.decorator';
import { AuthCookieService } from '../auth/auth-cookie.service';
import { DEMO_LOGIN_RATE_LIMIT } from './demo.constants';
import { DemoService } from './demo.service';
import { DemoLoginDto } from './dto/demo-login.dto';

@ApiTags('Demo')
@Controller('demo')
export class DemoController {
  constructor(
    private readonly demoService: DemoService,
    private readonly cookies: AuthCookieService,
  ) {}

  @Post('login')
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: DEMO_LOGIN_RATE_LIMIT })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in as a demo buyer / admin / staff (no password)' })
  async login(
    @Body() input: DemoLoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const { accessToken, member } = await this.demoService.login(input.role ?? 'BUYER');
    this.cookies.setAuth(res, accessToken);
    return { member };
  }
}
