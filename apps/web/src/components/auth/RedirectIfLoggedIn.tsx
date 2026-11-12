'use client';

import { useEffect } from 'react';
import { useMe } from '@/hooks/useAuth';
import { useRouter } from '@/i18n/navigation';
import { nextPath } from './authError';

/** /login and /signup make no sense for a member → send them on (?next=… or home) */
export function RedirectIfLoggedIn() {
  const { data: member } = useMe();
  const router = useRouter();

  useEffect(() => {
    if (member) router.replace(nextPath());
  }, [member, router]);

  return null;
}
