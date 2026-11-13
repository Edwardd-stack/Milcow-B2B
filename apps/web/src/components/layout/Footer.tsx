import { useTranslations } from 'next-intl';
import {
  ArrowRightIcon,
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
 * Footer:
 *   1. a CTA card floating over the page edge (quote / demo)
 *   2. brand column with 3 promise chips | services | company | contact
 *   3. a milk-wave line, copyright
 */
export function Footer() {
  const t = useTranslations('Footer');
  const nav = useTranslations('Nav');
  const tp = useTranslations('Privacy');
  const year = 2026; // static: keeps the footer cacheable (Cache Components)

  const services = [
    { label: nav('products'), href: '/products' },
    { label: nav('passport'), href: '/passport' },
    { label: nav('surplus'), href: '/surplus' },
    { label: nav('map'), href: '/map' },
  ];
  const company = [
    { label: nav('home'), href: '/' },
    { label: nav('contact'), href: '/contact' },
    { label: nav('login'), href: '/login' },
    { label: tp('footerLink'), href: '/privacy' },
  ];
  const promises = [
    { icon: FarmIcon, text: t('promiseFarm') },
    { icon: SnowflakeIcon, text: t('promiseCold') },
    { icon: TruckIcon, text: t('promiseFleet') },
  ];

  const heading = 'mb-4 text-xs font-bold tracking-[0.18em] text-white uppercase';
  const link =
    'group inline-flex items-center gap-2 text-sm transition hover:translate-x-1 hover:text-white';

  return (
    <footer className="relative mt-28 bg-navy text-white/75">
      {/* Background: soft blue glow + a faint dot grid */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-brand/40 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:22px_22px]" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        {/* 1. CTA card over the page edge */}
        <div className="relative -mt-20 overflow-hidden rounded-3xl lg:-mt-12 bg-gradient-to-r from-brand to-[#2f86d6] px-6 py-7 shadow-[0_24px_60px_rgba(17,55,95,0.35)] sm:px-10">
          <svg
            aria-hidden="true"
            viewBox="0 0 400 120"
            className="absolute -right-6 -bottom-6 h-36 w-auto text-white/10"
            fill="currentColor"
          >
            <path d="M0 80 C 60 40, 120 120, 200 70 S 330 30, 400 70 V120 H0Z" />
            <path d="M0 100 C 80 70, 140 130, 220 95 S 340 70, 400 95 V120 H0Z" />
          </svg>
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xl font-extrabold text-white sm:text-2xl">{t('ctaTitle')}</p>
              <p className="mt-1 text-sm text-white/80">{t('ctaText')}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(253,158,1,0.35)] transition hover:bg-accent-dark"
              >
                {t('ctaQuote')} <ArrowRightIcon />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-brand"
              >
                {t('ctaDemo')}
              </Link>
            </div>
          </div>
        </div>

        {/* 2. Columns */}
        <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 pb-12 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr] lg:gap-8">
          <div className="col-span-2 lg:col-span-1">
            <Logo className="h-14 w-auto" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed">{t('tagline')}</p>
            <ul className="mt-5 space-y-2.5">
              {promises.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-white/85">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-[#9fdcff]">
                    <Icon className="h-4 w-4" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label={t('services')}>
            <p className={heading}>{t('services')}</p>
            <ul className="space-y-3">
              {services.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={link}>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#9fdcff] transition group-hover:bg-accent" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t('company')}>
            <p className={heading}>{t('company')}</p>
            <ul className="space-y-3">
              {company.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={link}>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#9fdcff] transition group-hover:bg-accent" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="col-span-2 lg:col-span-1">
            <p className={heading}>{t('contactTitle')}</p>
            <ul className="space-y-3.5 text-sm">
              <li>
                <a
                  href={`tel:${COMPANY_CONTACT.phone}`}
                  className="flex items-center gap-3 transition hover:text-white"
                >
                  <PhoneIcon className="h-4 w-4 shrink-0 text-[#9fdcff]" />
                  {COMPANY_CONTACT.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${COMPANY_CONTACT.email}`}
                  className="flex min-w-0 items-center gap-3 transition hover:text-white"
                >
                  <MailIcon className="h-4 w-4 shrink-0 text-[#9fdcff]" />
                  <span className="truncate">{COMPANY_CONTACT.email}</span>
                </a>
              </li>
              <li className="flex items-center gap-3">
                <PinIcon className="h-4 w-4 shrink-0 text-[#9fdcff]" />
                {t('address')}
              </li>
              <li className="flex items-center gap-3">
                <ClockIcon className="h-4 w-4 shrink-0 text-[#9fdcff]" />
                {t('hours')}
              </li>
            </ul>
            <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold tracking-wider text-white uppercase">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ade80] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4ade80]" />
              </span>
              {t('b2bOnly')}
            </span>
          </div>
        </div>

        {/* 3. Milk-wave line + copyright */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1200 12"
          preserveAspectRatio="none"
          className="h-3 w-full text-white/20"
        >
          <path
            d="M0 6 Q 25 0 50 6 T 100 6 T 150 6 T 200 6 T 250 6 T 300 6 T 350 6 T 400 6 T 450 6 T 500 6 T 550 6 T 600 6 T 650 6 T 700 6 T 750 6 T 800 6 T 850 6 T 900 6 T 950 6 T 1000 6 T 1050 6 T 1100 6 T 1150 6 T 1200 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="flex flex-col gap-1.5 py-6 text-xs text-white/60 sm:flex-row sm:justify-between">
          <p>{t('portfolio')}</p>
          <p>
            © {year} Milcow. {t('rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}
