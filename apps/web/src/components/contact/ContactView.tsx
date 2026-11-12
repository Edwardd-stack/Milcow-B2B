'use client';

import { useTranslations } from 'next-intl';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { COMPANY_CONTACT } from '@/config/navigation';
import { ContactForm } from './ContactForm';
import { Faq } from './Faq';

const block = 'rounded-3xl bg-white shadow-[0_14px_40px_rgba(17,55,95,0.08)]';

/** /contact — form (saved as an Inquiry) + company details + FAQ */
export function ContactView() {
  const t = useTranslations('Contact');
  const tf = useTranslations('Footer');

  const info = [
    {
      label: tf('callUs'),
      value: COMPANY_CONTACT.phone,
      href: `tel:${COMPANY_CONTACT.phone}`,
      icon: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z',
    },
    {
      label: tf('emailUs'),
      value: COMPANY_CONTACT.email,
      href: `mailto:${COMPANY_CONTACT.email}`,
      icon: 'M4 6h16v12H4zM4 7l8 6 8-6',
    },
    {
      label: tf('office'),
      value: tf('address'),
      icon: 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21ZM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
    },
    {
      label: tf('workHours'),
      value: tf('hours'),
      icon: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
    },
  ];

  return (
    <>
      <PageHero title={t('title')} current={t('title')} />
      <Container>
        <div className="relative -mt-16 pb-24 min-[100rem]:-mt-[calc(6.95vw-1rem)]">
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section className={`${block} p-6 sm:p-9`}>
              <h2 className="text-2xl font-extrabold text-heading">{t('formTitle')}</h2>
              <p className="mt-2 text-muted">{t('formText')}</p>
              <ContactForm />
            </section>

            <aside className="space-y-4">
              {info.map((row) => {
                const body = (
                  <>
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cream text-brand">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d={row.icon} />
                      </svg>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm text-muted">{row.label}</span>
                      <span className="block truncate font-semibold text-heading">{row.value}</span>
                    </span>
                  </>
                );
                const cls = `${block} flex items-center gap-4 px-5 py-4`;
                return row.href ? (
                  <a
                    key={row.label}
                    href={row.href}
                    className={`${cls} transition hover:-translate-y-0.5`}
                  >
                    {body}
                  </a>
                ) : (
                  <div key={row.label} className={cls}>
                    {body}
                  </div>
                );
              })}
            </aside>
          </div>

          <Faq />
        </div>
      </Container>
    </>
  );
}
