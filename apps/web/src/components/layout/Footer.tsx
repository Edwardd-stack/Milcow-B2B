import { useTranslations } from 'next-intl';
import { ArrowRightIcon, ClockIcon, MailIcon, PhoneIcon, PinIcon } from '@/components/icons';
import { COMPANY_CONTACT, visibleNav } from '@/config/navigation';
import { Link } from '@/i18n/navigation';
import { Logo } from './Logo';

/**
 * Template-style footer: navy contact bar sitting half over the page edge,
 * blue footer with soft shapes, 4 columns, thin line + copyright.
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
  const services = ['bulkOrder', 'supplyContract', 'pickup', 'aiAssistant'] as const;

  return (
    <footer className="relative mt-20 bg-brand text-white/80">
      {/* Soft background shapes */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -bottom-40 -left-24 h-[420px] w-[620px] rounded-[45%] bg-brand-dark/25" />
        <div className="absolute -right-32 top-40 h-[360px] w-[520px] rounded-[45%] bg-brand-dark/20" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        {/* Navy contact bar — half above the footer edge on desktop; on phones it is tall (4 rows),
            so it only peeks 48px above the edge instead of covering the section above */}
        <ul className="-translate-y-12 grid lg:-translate-y-1/2 gap-6 rounded-xl bg-navy px-6 py-7 shadow-xl sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
          {contacts.map(({ icon: Icon, title, value, href }) => (
            <li key={title} className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                <Icon />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-white">{title}</p>
                {href ? (
                  <a href={href} className="text-sm hover:text-white">
                    {value}
                  </a>
                ) : (
                  <p className="text-sm">{value}</p>
                )}
              </div>
            </li>
          ))}
        </ul>

        <div className="grid gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.5fr] lg:pt-2">
          <div className="space-y-5">
            <Logo className="h-16 w-auto" />
            <p className="text-sm leading-relaxed">{t('tagline')}</p>
            <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-white uppercase">
              {t('b2bOnly')}
            </span>
          </div>

          <FooterColumn title={t('menu')}>
            {visibleNav(false).map((item) => (
              <li key={item.key}>
                <Link href={item.href} className="hover:text-white">
                  {nav(item.key)}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title={t('services')}>
            {services.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </FooterColumn>

          {/* Where the template has a newsletter: a B2B consultation call-to-action */}
          <div>
            <h2 className="mb-5 text-lg font-semibold text-white">{t('ctaTitle')}</h2>
            <p className="mb-5 text-sm leading-relaxed">{t('ctaText')}</p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-medium text-white shadow-md transition hover:bg-brand-dark"
            >
              {t('ctaButton')}
              <ArrowRightIcon />
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/20 py-6 text-sm sm:flex-row sm:justify-between">
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

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-5 text-lg font-semibold text-white">{title}</h2>
      <ul className="space-y-3 text-sm">{children}</ul>
    </div>
  );
}
