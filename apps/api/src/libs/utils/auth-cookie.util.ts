import type { CookieOptions } from 'express';

/** Name of the httpOnly cookie that carries the JWT */
export const AUTH_COOKIE = 'milcow_token';

/**
 * httpOnly  → JavaScript in the browser can't read it (an XSS bug can't steal the token)
 * sameSite  → "lax": not sent on cross-site POSTs (basic CSRF protection), still sent on normal links
 * secure    → HTTPS only in production (localhost is plain http)
 */
export function authCookieOptions(maxAgeSec: number, isProduction: boolean): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: maxAgeSec * 1000, // express wants milliseconds
  };
}

/** Reads one cookie from a raw "Cookie" header (no cookie-parser dependency needed) */
export function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}
