import type { MemberType } from '@milcow/shared';
import { useMe } from './useAuth';

/** Where each role lands after login / when opening the console */
export const ROLE_HOME: Record<MemberType, string> = {
  BUYER: '/',
  ADMIN: '/admin',
  STAFF: '/admin/pickup',
};

/**
 * The logged-in member's role. Only for showing the right UI —
 * every permission is checked again by the API.
 */
export function useRole() {
  const { data: member, isPending, isError } = useMe();
  const role = member?.memberType ?? null;
  return {
    member: member ?? null,
    role,
    isPending,
    isError, // /auth/me failed (API restarting, network) — not the same as "guest"
    isAdmin: role === 'ADMIN',
    isStaff: role === 'STAFF',
    isConsole: role === 'ADMIN' || role === 'STAFF',
    isDemo: member?.memberIsDemo ?? false,
  };
}
