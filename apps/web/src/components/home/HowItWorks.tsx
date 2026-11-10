import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRightIcon } from '@/components/icons';
import { Container } from '@/components/ui/Container';
import { Link } from '@/i18n/navigation';
import { StepIllustration } from './StepIllustration';

const STEPS = ['order', 'contract', 'payment', 'pickup'] as const;

/**
 * Photo in the background, a blue layer over it, four frosted-glass step cards on top.
 * The photo is decoration (alt="" would hide it), but it still gets an alt for context.
 */
export function HowItWorks() {
  const t = useTranslations('HowItWorks');
  const locale = useLocale();
  const eyebrowText = locale === 'ko' ? 'text-[17px]' : 'text-base';

  return (
    <section className="relative isolate overflow-hidden py-24 text-white lg:py-20">
      {/* Background: photo + brand-coloured layer so white text stays readable */}
      <Image
        src="/images/news/dairy-market.webp"
        alt={t('photoAlt')}
        fill
        sizes="100vw"
        className="-z-20 object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-navy/95 via-brand/[0.88] to-brand/75" />

      <Container>
        <div className="mx-auto max-w-4xl text-center">
          <p className={`mb-4 font-semibold tracking-[0.2em] uppercase ${eyebrowText}`}>
            {t('eyebrow')}
          </p>
          <h2 className="text-[clamp(2rem,4.5vw,3.125rem)] leading-[1.12] font-extrabold uppercase">
            {t('title')}
          </h2>
          <p className="mt-6 leading-relaxed font-light text-white/90">{t('text')}</p>
        </div>

        <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((key, i) => (
            <li
              key={key}
              // Brighter frosted glass + light border + deep shadow → the cards pop off the photo
              className="group relative cursor-default overflow-hidden rounded-2xl border border-white/40 bg-white/[0.17] p-7 shadow-2xl shadow-navy/40 ring-1 ring-white/10 backdrop-blur-lg transition duration-300 ring-inset hover:-translate-y-1.5 hover:bg-white/25"
            >
              {/* Light streak along the top edge */}
              <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
              <span className="absolute top-4 right-5 text-5xl font-extrabold text-white/25">
                {String(i + 1).padStart(2, '0')}
              </span>
              <StepIllustration step={key} className="h-[72px] w-[72px]" />
              <h3 className="mt-6 text-xl font-semibold">{t(`${key}Title`)}</h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-white/90">{t(`${key}Text`)}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 text-center">
          <Link
            href="/contracts"
            className="group inline-flex items-center gap-3 rounded-full bg-white py-2 pr-2 pl-7 font-medium text-navy shadow-lg transition hover:bg-cream"
          >
            {t('button')}
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white transition group-hover:translate-x-1">
              <ArrowRightIcon />
            </span>
          </Link>
        </div>
      </Container>
    </section>
  );
}
