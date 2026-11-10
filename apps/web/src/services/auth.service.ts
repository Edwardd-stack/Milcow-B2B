import type { AuthResponse, LoginInput, MemberInfo, SignupInput } from '@milcow/shared';
import { apiFetch } from '@/lib/api-client';

// The JWT never reaches JavaScript: the API sets/clears an httpOnly cookie,
// apiFetch sends it back automatically (credentials: 'include').

/** POST /auth/login */
export function login(input: LoginInput) {
  return apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(input) });
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
