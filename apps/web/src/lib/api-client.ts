import type { ApiError } from '@milcow/shared';

/**
 * Browser: relative "/api/v1" → goes through the Next.js proxy (next.config.ts rewrites).
 * Server (Server Components, route handlers): there is no "current origin", so call the API directly.
 */
const API_URL =
  typeof window === 'undefined'
    ? `${process.env.API_ORIGIN ?? 'http://localhost:3000'}/api/v1`
    : '/api/v1';

/** Thrown when the API answers with a non-2xx status. */
export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

/**
 * The single place where the web app talks to the API.
 * Every service function goes through here, so base URL, headers
 * and error handling are written once.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    credentials: 'include', // send the httpOnly auth cookie
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiError | null;
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new ApiRequestError(response.status, message ?? response.statusText);
  }

  // 204 No Content (e.g. logout) has no body to parse
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
