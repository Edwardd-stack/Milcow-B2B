import { useTranslations } from 'next-intl';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { COMPANY_CONTACT } from '@/config/navigation';

const SECTIONS = [
  'collect',
  'social',
  'use',
  'thirdParty',
  'cookies',
  'retention',
  'rights',
] as const;

/** /privacy — privacy policy (needed by Google / Kakao login). Plain text, no client JS. */
export function PrivacyView() {
  const t = useTranslations('Privacy');
  return (
    <>
      <PageHero title={t('title')} current={t('title')} />
      <Container>
        <article className="relative -mt-16 mb-24 rounded-3xl bg-white p-6 shadow-[0_14px_40px_rgba(17,55,95,0.08)] sm:p-10 min-[100rem]:-mt-[calc(6.95vw-1rem)]">
          <p className="rounded-2xl bg-cream px-5 py-4 text-sm text-muted">{t('notice')}</p>
          <p className="mt-6 leading-relaxed text-ink">{t('intro')}</p>
          {SECTIONS.map((key, i) => (
            <section key={key} className="mt-8">
              <h2 className="text-lg font-bold text-heading">
                {i + 1}. {t(`${key}.title`)}
              </h2>
              <p className="mt-2 leading-relaxed whitespace-pre-line text-muted">
                {t(`${key}.text`)}
              </p>
            </section>
          ))}
          <section className="mt-8">
            <h2 className="text-lg font-bold text-heading">
              {SECTIONS.length + 1}. {t('contact.title')}
            </h2>
            <p className="mt-2 text-muted">
              {t('contact.text')}{' '}
              <a
                href={`mailto:${COMPANY_CONTACT.email}`}
                className="font-semibold text-brand hover:underline"
              >
                {COMPANY_CONTACT.email}
              </a>
            </p>
          </section>
          <p className="mt-10 text-sm text-soft">{t('updated')}</p>
        </article>
      </Container>
    </>
  );
}
