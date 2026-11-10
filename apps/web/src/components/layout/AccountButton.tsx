'use client';

import { useTranslations } from 'next-intl';
import { useLogout, useMe } from '@/hooks/useAuth';
import { Link, useRouter } from '@/i18n/navigation';

/**
 * Header right side: "Log in" for guests; company name + log-out button for members.
 * While /auth/me is loading we keep the guest button (no flicker for most visitors).
 */
export function AccountButton({
  onNavigate,
  compact = false,
}: {
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const t = useTranslations('Nav');
  const router = useRouter();
  const { data: member } = useMe();
  const logoutMutation = useLogout();

  const pill = compact
    ? 'rounded-full px-6 py-2.5 text-sm font-medium'
    : 'rounded-full px-7 py-3 text-[15px] font-medium shadow-md';

  if (!member) {
    return (
      <Link
        href="/login"
        onClick={onNavigate}
        className={`${pill} bg-navy whitespace-nowrap text-white transition hover:bg-brand-dark`}
      >
        {t('login')}
      </Link>
    );
  }

  const name = member.memberCompanyName ?? member.memberNick;
  return (
    <div className="flex items-center gap-2">
      <span
        title={member.memberEmail}
        className={`${pill} flex max-w-[200px] items-center gap-2 bg-navy text-white`}
      >
        <span
          aria-hidden="true"
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-brand"
        >
          {name
            .replace(/^\(.+?\)/, '')
            .trim()
            .charAt(0)}
        </span>
        <span className="truncate">{name}</span>
      </span>
      <button
        type="button"
        disabled={logoutMutation.isPending}
        onClick={() =>
          logoutMutation.mutate(undefined, {
            onSuccess: () => {
              onNavigate?.();
              router.push('/');
            },
          })
        }
        aria-label={t('logout')}
        title={t('logout')}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3" />
        </svg>
      </button>
    </div>
  );
}
