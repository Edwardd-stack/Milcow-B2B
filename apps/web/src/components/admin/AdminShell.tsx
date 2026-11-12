'use client';

import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useRole } from '@/hooks/useRole';
import { Link, usePathname, useRouter } from '@/i18n/navigation';

/** Sidebar items. `staff`: also visible to warehouse staff (they only get the pickup gate). */
const NAV = [
  {
    key: 'dashboard',
    href: '/admin',
    icon: 'M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z',
  },
  {
    key: 'orders',
    href: '/admin/orders',
    icon: 'M6 4h12l1 4H5l1-4ZM5 8h14v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8ZM9 12h6',
  },
  {
    key: 'contracts',
    href: '/admin/contracts',
    icon: 'M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM14 3v5h5M9 13h6M9 17h4',
  },
  {
    key: 'pickup',
    href: '/admin/pickup',
    staff: true,
    icon: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2',
  },
  {
    key: 'products',
    href: '/admin/products',
    icon: 'M21 8 12 3 3 8v8l9 5 9-5V8ZM3 8l9 5 9-5M12 13v8',
  },
  { key: 'inquiries', href: '/admin/inquiries', icon: 'M4 5h16v11H8l-4 4V5Z' },
  {
    key: 'copilot',
    href: '/admin/copilot',
    icon: 'M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4L12 3ZM18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9L18 15Z',
  },
] as const;

/**
 * /admin frame: role gate + sidebar.
 * The gate is only for a good UX — the API checks every permission again (403).
 *   guest → login, buyer → home, staff → pickup gate only, admin → everything
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const t = useTranslations('Admin');
  const pathname = usePathname();
  const router = useRouter();
  const { role, isPending: rolePending, isError, isDemo, isStaff } = useRole();
  // The role is only known in the browser (httpOnly cookie → /auth/me). Until hydration is done we
  // render exactly what the server rendered (skeleton), so the markup never mismatches.
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const isPending = rolePending || !hydrated;

  const staffOutside = isStaff && !pathname.startsWith('/admin/pickup');
  useEffect(() => {
    if (isPending || isError) return;
    if (!role) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (role === 'BUYER') router.replace('/');
    else if (staffOutside) router.replace('/admin/pickup');
  }, [isPending, isError, role, staffOutside, pathname, router]);

  const allowed = !isPending && (role === 'ADMIN' || (isStaff && !staffOutside));
  const items = isPending
    ? []
    : NAV.filter((item) => role === 'ADMIN' || ('staff' in item && item.staff));
  const active = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <div className="flex-1 bg-cream">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-6 lg:flex-row lg:px-8 lg:py-8">
        {/* Sidebar (desktop) / scrollable tab row (mobile) */}
        <nav
          aria-label={t('title')}
          className="lg:sticky lg:top-6 lg:w-56 lg:shrink-0 lg:self-start"
        >
          <p className="mb-3 hidden px-3 text-xs font-semibold tracking-[0.16em] text-muted uppercase lg:block">
            {t(isStaff ? 'staffTitle' : 'title')}
          </p>
          <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:px-0">
            {items.map((item) => (
              <li key={item.key} className="shrink-0">
                <Link
                  href={item.href}
                  aria-current={active(item.href) ? 'page' : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition ${
                    active(item.href)
                      ? 'bg-brand text-white shadow-[0_8px_20px_rgba(32,101,174,0.25)]'
                      : 'text-heading hover:bg-white'
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-[18px] w-[18px] shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d={item.icon} />
                  </svg>
                  {t(`nav.${item.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 flex-1">
          {isDemo && allowed && (
            <p className="mb-5 rounded-2xl border border-dashed border-brand/35 bg-white px-4 py-3 text-sm text-heading">
              🧪 <b>{t('demoBanner.title')}</b> — {t('demoBanner.text')}
            </p>
          )}
          {allowed ? (
            children
          ) : (
            <div className="space-y-4">
              <div className="h-28 animate-pulse rounded-3xl bg-white" />
              <div className="h-80 animate-pulse rounded-3xl bg-white" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const noopSubscribe = () => () => {};

/** Page title row used by every admin page */
export function AdminHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-heading sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

/** White rounded card */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-3xl bg-white p-5 shadow-[0_14px_40px_rgba(17,55,95,0.06)] sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

/** Error from a demo session trying to change real data, or any other API error */
export function apiErrorText(
  error: unknown,
  t: (key: 'errors.demo' | 'errors.generic') => string,
): string | null {
  if (!error) return null;
  const status = (error as { status?: number }).status;
  const message = error instanceof Error ? error.message : '';
  if (status === 403 && message.includes('Demo')) return t('errors.demo');
  return message || t('errors.generic');
}
