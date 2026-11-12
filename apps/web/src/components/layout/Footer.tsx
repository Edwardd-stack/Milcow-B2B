import { useTranslations } from 'next-intl';
import { ClockIcon, MailIcon, PhoneIcon, PinIcon } from '@/components/icons';
import { COMPANY_CONTACT, visibleNav } from '@/config/navigation';
import { Link } from '@/i18n/navigation';
import { Logo } from './Logo';

/**
 * Compact footer: navy contact bar sitting half over the page edge,
 * then one row (logo + tagline | menu) and a thin copyright line.
 */
export function Footer() {
  const t = useTranslations('Footer');
  const nav = useTranslations('Nav');
  const tp = useTranslations('Privacy');
  const year = 2026; // static: keeps the footer cacheable (Cache Components)

  const contacts = [
    {
      icon: PhoneIcon,
      title: t('callUs'),
      value: COMPANY_CONTACT.phone,
      href: `tel:${COMPANY_CONTACT.phone}`,
    },
    {
      icon: MailIcon,
      title: t('emailUs'),
      value: COMPANY_CONTACT.email,
      href: `mailto:${COMPANY_CONTACT.email}`,
    },
    { icon: PinIcon, title: t('office'), value: t('address') },
    { icon: ClockIcon, title: t('workHours'), value: t('hours') },
  ];

  return (
    <footer className="relative mt-16 bg-brand text-white/80">
      {/* Soft background shapes */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -bottom-48 -left-24 h-[360px] w-[560px] rounded-[45%] bg-brand-dark/25" />
        <div className="absolute -right-32 top-10 h-[300px] w-[460px] rounded-[45%] bg-brand-dark/20" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        {/* Navy contact bar — 2×2 on phones, one row on desktop */}
        <ul className="grid -translate-y-10 grid-cols-2 gap-x-4 gap-y-5 rounded-xl bg-navy px-5 py-5 shadow-xl lg:-translate-y-1/2 lg:grid-cols-4 lg:px-8">
          {contacts.map(({ icon: Icon, title, value, href }) => (
            <li key={title} className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                <Icon />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{title}</p>
                {href ? (
                  <a href={href} className="block truncate text-[13px] hover:text-white">
                    {value}
                  </a>
                ) : (
                  <p className="truncate text-[13px]">{value}</p>
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* Logo + tagline | menu */}
        <div className="-mt-4 flex flex-col gap-6 pb-8 lg:-mt-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Logo className="h-12 w-auto shrink-0" />
            <div>
              <p className="text-sm leading-snug">{t('tagline')}</p>
              <span className="mt-1.5 inline-block rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-white uppercase">
                {t('b2bOnly')}
              </span>
            </div>
          </div>

          <nav aria-label={t('menu')}>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
              {visibleNav(false).map((item) => (
                <li key={item.key}>
                  <Link href={item.href} className="hover:text-white">
                    {nav(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex flex-col gap-1.5 border-t border-white/20 py-5 text-xs sm:flex-row sm:justify-between">
          <p>{t('portfolio')}</p>
          <p className="flex flex-wrap gap-x-4">
            <Link href="/privacy" className="hover:text-white">
              {tp('footerLink')}
            </Link>
            <span>
              © {year} Milcow. {t('rights')}
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
