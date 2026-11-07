import type { ApiError } from '@milcow/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
  if (!API_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is not set — see apps/web/.env.example');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    credentials: 'include', // send cookies (needed later for auth)
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiError | null;
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new ApiRequestError(response.status, message ?? response.statusText);
  }

  return (await response.json()) as T;
}
