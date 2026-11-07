import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

/**
 * Runs before every page request (Next.js 16: "proxy", formerly "middleware").
 * Redirects "/" → "/ko" (or the browser's preferred language) and
 * remembers the user's choice in a cookie.
 */
export default createMiddleware(routing);

export const config = {
  // All paths except: /api, /_next, /_vercel and files with a dot (favicon.ico, logo.png)
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};
