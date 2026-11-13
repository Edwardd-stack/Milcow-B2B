import type {
  AuthResponse,
  DemoRole,
  LoginInput,
  MemberInfo,
  SignupInput,
  SocialCompleteInput,
  SocialPendingInfo,
  SocialProvider,
} from '@milcow/shared';
import { apiFetch } from '@/lib/api-client';

// The JWT never reaches JavaScript: the API sets/clears an httpOnly cookie,
// apiFetch sends it back automatically (credentials: 'include').

/** POST /auth/login */
export function login(input: LoginInput) {
  return apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(input) });
}

/** POST /demo/login — a demo buyer / admin / staff account, no password (the API sets the cookie) */
export function demoLogin(role: DemoRole = 'BUYER') {
  return apiFetch<AuthResponse>('/demo/login', { method: 'POST', body: JSON.stringify({ role }) });
}

/** POST /auth/signup */
export function signup(input: SignupInput) {
  return apiFetch<AuthResponse>('/auth/signup', { method: 'POST', body: JSON.stringify(input) });
}

/** POST /auth/logout — 204, no body */
export function logout() {
  return apiFetch<void>('/auth/logout', { method: 'POST' });
}

/** GET /auth/me — the logged-in member, or null for a guest */
export async function getMe() {
  const { member } = await apiFetch<{ member: MemberInfo | null }>('/auth/me');
  return member;
}

/**
 * Kakao / Google: a normal link (full page navigation, not fetch) — the API redirects
 * to the provider and back. `next` = where to land after login.
 */
export function socialStartUrl(provider: SocialProvider, next: string) {
  return `/api/v1/auth/${provider}/start?next=${encodeURIComponent(next)}`;
}

/** GET /auth/social/pending — what Kakao / Google told us about a new user (null = nothing pending) */
export async function getSocialPending() {
  const { pending } = await apiFetch<{ pending: SocialPendingInfo | null }>('/auth/social/pending');
  return pending;
}

/** POST /auth/social/complete — company form after the first social login */
export function completeSocial(input: SocialCompleteInput) {
  return apiFetch<AuthResponse & { next: string }>('/auth/social/complete', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
