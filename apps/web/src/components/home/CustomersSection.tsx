import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Container } from '@/components/ui/Container';

/**
 * "Who uses Milcow" — template testimonial cards, but honest:
 * each card is a customer TYPE and how it uses the platform (no invented quotes).
 */
const CUSTOMERS = [
  { key: 'cafe', photo: '/images/people/man-drinking-milk.webp' },
  { key: 'bakery', photo: '/images/people/young-woman.webp' },
  { key: 'factory', photo: '/images/people/man2-drinking-milk.webp' },
  { key: 'catering', photo: '/images/people/korean-woman.webp' },
] as const;

export function CustomersSection() {
  const t = useTranslations('Customers');
  const locale = useLocale();
  const eyebrowText = locale === 'ko' ? 'text-[17px]' : 'text-base';

  return (
    <section className="py-16 lg:py-18">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className={`mb-4 font-semibold tracking-[0.2em] text-brand uppercase ${eyebrowText}`}>
            {t('eyebrow')}
          </p>
          <h2 className="text-[clamp(2rem,4.5vw,3.125rem)] leading-[1.12] font-extrabold text-navy uppercase">
            {t('title')}
          </h2>
          <p className="mt-5 leading-relaxed font-light text-muted">{t('text')}</p>
        </div>

        <ul className="mt-14 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {CUSTOMERS.map(({ key, photo }) => (
            <li
              key={key}
              className="relative flex flex-col items-center rounded-2xl bg-brand px-6 pt-8 pb-7 text-center text-white shadow-[0_18px_40px_rgba(32,101,174,0.25)] transition duration-300 hover:-translate-y-1.5 hover:bg-brand-dark"
            >
              {/* Big quote mark in the corner (template detail) */}
              <span
                aria-hidden="true"
                className="absolute top-4 left-5 font-serif text-6xl leading-none text-white/25"
              >
                &ldquo;
              </span>
              <span className="relative h-20 w-20 overflow-hidden rounded-full ring-4 ring-white/30">
                <Image src={photo} alt="" fill sizes="80px" className="object-cover" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{t(`${key}.title`)}</h3>
              <p className="mt-1 text-sm text-white/70">{t(`${key}.who`)}</p>
              <p className="mt-4 text-[15px] leading-relaxed text-white/90">{t(`${key}.text`)}</p>

              {/* Which Milcow features this customer type uses */}
              <ul className="mt-auto flex justify-center gap-1.5 pt-6">
                {(['tag1', 'tag2'] as const).map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium whitespace-nowrap"
                  >
                    {t(`${key}.${tag}`)}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
