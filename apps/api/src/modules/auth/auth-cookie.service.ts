import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AUTH_COOKIE, authCookieOptions } from '../../libs/utils/auth-cookie.util';

/** Sets and clears the httpOnly cookies of the auth flow — one place, same options everywhere */
@Injectable()
export class AuthCookieService {
  constructor(private readonly config: ConfigService) {}

  /** The login cookie (JWT), lives as long as the token */
  setAuth(res: Response, token: string) {
    this.set(res, AUTH_COOKIE, token, this.config.getOrThrow<number>('JWT_EXPIRES_IN_SEC'));
  }

  clearAuth(res: Response) {
    this.clear(res, AUTH_COOKIE);
  }

  /** Any httpOnly cookie with a custom lifetime (OAuth state, pending social signup) */
  set(res: Response, name: string, value: string, maxAgeSec: number) {
    res.cookie(name, value, authCookieOptions(maxAgeSec, this.isProduction()));
  }

  /** Must use the same options as when it was set (except maxAge), otherwise the browser keeps it */
  clear(res: Response, name: string) {
    const options = authCookieOptions(0, this.isProduction());
    delete options.maxAge;
    res.clearCookie(name, options);
  }

  private isProduction() {
    return this.config.get<string>('NODE_ENV') === 'production';
  }
}
