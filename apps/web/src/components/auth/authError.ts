import { ApiRequestError } from '@/lib/api-client';

/** Maps an API error to a key in the "Auth.errors" messages */
export function authErrorKey(
  error: unknown,
): 'invalid' | 'inactive' | 'emailTaken' | 'tooMany' | 'server' {
  if (!(error instanceof ApiRequestError)) return 'server';
  if (error.status === 401) return 'invalid';
  if (error.status === 403) return 'inactive';
  if (error.status === 409) return 'emailTaken';
  if (error.status === 429) return 'tooMany';
  return 'server';
}

/** After login go back to where the visitor came from (?next=/contracts), never to another site */
export function nextPath(): string {
  const next = new URLSearchParams(window.location.search).get('next');
  return next?.startsWith('/') && !next.startsWith('//') ? next : '/';
}
