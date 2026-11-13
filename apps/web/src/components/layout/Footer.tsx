import { useTranslations } from 'next-intl';
import {
  ClockIcon,
  FarmIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  SnowflakeIcon,
  TruckIcon,
} from '@/components/icons';
import { COMPANY_CONTACT } from '@/config/navigation';
import { Link } from '@/i18n/navigation';
import { Logo } from './Logo';

/**
 * Footer (background = the Milcow template: brand blue + 10% "memphis paper" pattern):
 *   1. contact card floating over the page edge
 *   2. logo + promises | services | quick links
 *   3. milk-wave line, B2B badge + copyright
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
  const columns = [
    {
      title: t('services'),
      links: [
        { label: nav('products'), href: '/products' },
        { label: nav('passport'), href: '/passport' },
        { label: nav('surplus'), href: '/surplus' },
        { label: nav('map'), href: '/map' },
      ],
    },
    {
      title: t('company'),
      links: [
        { label: nav('home'), href: '/' },
        { label: nav('contact'), href: '/contact' },
        { label: nav('login'), href: '/login' },
        { label: tp('footerLink'), href: '/privacy' },
      ],
    },
  ];
  const promises = [
    { icon: FarmIcon, text: t('promiseFarm') },
    { icon: SnowflakeIcon, text: t('promiseCold') },
    { icon: TruckIcon, text: t('promiseFleet') },
  ];

  return (
    <footer className="relative mt-28 bg-brand text-white/90">
      {/* Template background: patterned paper at 10% over the brand blue */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[url('/images/footer-pattern.webp')] bg-cover bg-bottom bg-no-repeat opacity-10"
      />

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        {/* 1. Contact card over the page edge */}
        <div className="relative -mt-16 overflow-hidden rounded-3xl bg-gradient-to-r from-brand to-[#2f86d6] px-6 py-6 shadow-[0_24px_60px_rgba(17,55,95,0.35)] ring-1 ring-white/15 sm:px-10 lg:-mt-12">
          <svg
            aria-hidden="true"
            viewBox="0 0 400 120"
            className="absolute -right-6 -bottom-6 h-36 w-auto text-white/10"
            fill="currentColor"
          >
            <path d="M0 80 C 60 40, 120 120, 200 70 S 330 30, 400 70 V120 H0Z" />
            <path d="M0 100 C 80 70, 140 130, 220 95 S 340 70, 400 95 V120 H0Z" />
          </svg>
          <ul className="relative grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 sm:gap-y-5 lg:grid-cols-4 lg:gap-6">
            {contacts.map(({ icon: Icon, title, value, href }) => (
              <li key={title} className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 sm:h-11 sm:w-11 text-white ring-1 ring-white/25">
                  <Icon />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  {href ? (
                    <a
                      href={href}
                      className="block truncate text-[13px] text-white/90 hover:text-white"
                    >
                      {value}
                    </a>
                  ) : (
                    <p className="truncate text-[13px] text-white/90">{value}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* 2. Logo + promises | services | quick links */}
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-9 pb-9 lg:grid-cols-[1.6fr_1fr_1fr] lg:gap-10">
          <div className="col-span-2 lg:col-span-1">
            <Logo className="h-14 w-auto" />
            <ul className="mt-5 space-y-3">
              {promises.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-[15px] text-white">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/15 text-white">
                    <Icon className="h-4 w-4" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="mb-4 text-sm font-bold tracking-[0.16em] text-white uppercase">
                {col.title}
              </p>
              <ul className="space-y-3">
                {col.links.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="group inline-flex items-center gap-2.5 text-[15px] text-white/90 transition hover:translate-x-1 hover:text-white"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-white/70 transition group-hover:bg-accent" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* 3. Milk-wave line + badge + copyright */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1200 12"
          preserveAspectRatio="none"
          className="h-3 w-full text-white/30"
        >
          <path
            d="M0 6 Q 25 0 50 6 T 100 6 T 150 6 T 200 6 T 250 6 T 300 6 T 350 6 T 400 6 T 450 6 T 500 6 T 550 6 T 600 6 T 650 6 T 700 6 T 750 6 T 800 6 T 850 6 T 900 6 T 950 6 T 1000 6 T 1050 6 T 1100 6 T 1150 6 T 1200 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="flex flex-col gap-3 py-5 text-xs text-white/85 sm:flex-row sm:items-center sm:justify-between">
          <p>{t('portfolio')}</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-semibold tracking-wider text-white uppercase ring-1 ring-white/20">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ade80] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4ade80]" />
              </span>
              {t('b2bOnly')}
            </span>
            <span>
              © {year} Milcow. {t('rights')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
