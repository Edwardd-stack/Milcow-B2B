'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MAIN_NAV } from '@/config/navigation';
import { Container } from '@/components/ui/Container';
import { Link, usePathname } from '@/i18n/navigation';
import { AccountButton } from './AccountButton';
import { LocaleSwitcher } from './LocaleSwitcher';
import { Logo } from './Logo';

/**
 * Template-style header: same blue as the hero, thin light line underneath,
 * logo · centered menu · language + navy pill button. Mobile (< lg): hamburger panel.
 */
export function Header() {
  const t = useTranslations('Nav');
  const locale = useLocale();
  // Latin words are wider than Hangul → slightly smaller menu text for en/uz
  const navText = locale === 'ko' ? 'text-[15px]' : 'text-[14px]';
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="relative z-50 border-b border-white/15 bg-brand">
      <Container className="flex h-22 items-center justify-between gap-6">
        <Logo />

        {/* Desktop menu */}
        <nav aria-label={t('menu')} className="hidden xl:block">
          <ul className="flex items-center gap-8 2xl:gap-9">
            {MAIN_NAV.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={`relative py-2 ${navText} font-medium whitespace-nowrap text-white/85 transition hover:text-white aria-[current=page]:text-white`}
                >
                  {t(item.key)}
                  {isActive(item.href) && (
                    <span className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-white" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <LocaleSwitcher />
          </div>
          <div className="hidden sm:block">
            <AccountButton />
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t('closeMenu') : t('openMenu')}
            className="flex h-11 w-11 items-center justify-center rounded-full text-white hover:bg-white/10 xl:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </Container>

      {/* Mobile panel */}
      <div id="mobile-menu" hidden={!open} className="border-t border-white/15 bg-brand xl:hidden">
        <nav aria-label={t('menu')} className="mx-auto w-full max-w-7xl px-5 py-4 sm:px-8">
          <ul className="flex flex-col">
            {MAIN_NAV.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)} // close the panel after choosing a page
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className="block rounded-lg px-3 py-3 text-lg font-medium text-white/85 hover:bg-white/10 aria-[current=page]:bg-white/15 aria-[current=page]:text-white"
                >
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/15 pt-4 sm:hidden">
            <LocaleSwitcher />
            <AccountButton compact onNavigate={() => setOpen(false)} />
          </div>
        </nav>
      </div>
    </header>
  );
}
