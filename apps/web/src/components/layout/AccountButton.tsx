'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ACCOUNT_NAV } from '@/config/navigation';
import { useLogout, useMe } from '@/hooks/useAuth';
import { Link, useRouter } from '@/i18n/navigation';

const ICONS: Record<(typeof ACCOUNT_NAV)[number]['key'], string> = {
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20a8 8 0 0 1 16 0',
  orders: 'M6 4h12l1 4H5l1-4ZM5 8h14v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8ZM9 12h6',
  myContracts:
    'M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM14 3v5h5M9 13h6M9 17h4',
};
const LOGOUT_ICON = 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3';

/**
 * Header right side: "Log in" for guests.
 * Members: company-name button → dropdown (profile, my orders, my contracts, log out).
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
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Close on a click outside or on Escape
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

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
  const close = () => {
    setOpen(false);
    onNavigate?.();
  };
  const item =
    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] font-medium text-heading transition hover:bg-cream';

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={member.memberEmail}
        className={`${pill} flex max-w-[220px] items-center gap-2 bg-navy text-white transition hover:bg-brand-dark`}
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
        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 shrink-0 transition ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t('account')}
          className="absolute right-0 z-50 mt-2 w-60 rounded-2xl bg-white p-2 shadow-[0_18px_44px_rgba(17,55,95,0.2)]"
        >
          <div className="border-b border-line px-3 pt-1.5 pb-3">
            <p className="truncate font-bold text-heading">{name}</p>
            <p className="truncate text-xs text-muted">{member.memberEmail}</p>
          </div>
          <div className="py-1.5">
            {ACCOUNT_NAV.map((nav) => (
              <Link key={nav.key} href={nav.href} role="menuitem" onClick={close} className={item}>
                <Icon d={ICONS[nav.key]} />
                {t(nav.key)}
              </Link>
            ))}
          </div>
          <button
            type="button"
            role="menuitem"
            disabled={logoutMutation.isPending}
            onClick={() =>
              logoutMutation.mutate(undefined, {
                onSuccess: () => {
                  close();
                  router.push('/');
                },
              })
            }
            className={`${item} border-t border-line text-muted hover:text-[#b42318]`}
          >
            <Icon d={LOGOUT_ICON} />
            {t('logout')}
          </button>
        </div>
      )}
    </div>
  );
}

function Icon({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0 text-brand"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
