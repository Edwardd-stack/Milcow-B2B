import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { OpenChatButton } from '@/components/ai/OpenChatButton';
import { ArrowRightIcon } from '@/components/icons';
import { Container } from '@/components/ui/Container';
import { Link } from '@/i18n/navigation';

/**
 * Final call to action — two paths for two kinds of visitors:
 * ready to buy → business account, still exploring → ask the AI first (no sign-up).
 */
export function CtaSection() {
  const t = useTranslations('Cta');
  const locale = useLocale();
  const eyebrowText = locale === 'ko' ? 'text-[17px]' : 'text-base';
  const cardTitle = locale === 'ko' ? 'text-[28px]' : 'text-[26px]';
  const btn =
    'group mt-auto inline-flex items-center gap-2.5 self-start rounded-full px-7 py-3.5 font-semibold whitespace-nowrap transition hover:-translate-y-0.5';
  const card =
    'relative flex min-h-[340px] flex-col overflow-hidden rounded-[28px] px-7 py-10 transition duration-300 hover:-translate-y-1.5 sm:px-11 sm:py-12';
  const tag = 'self-start rounded-full px-3.5 py-1.5 text-[13px] font-semibold';

  return (
    <section className="bg-cream pt-16 pb-20 lg:pt-16 lg:pb-20">
      <Container>
        <div className="mb-12 text-center">
          <p className={`mb-4 font-semibold tracking-[0.2em] text-brand uppercase ${eyebrowText}`}>
            {t('eyebrow')}
          </p>
          <h2 className="text-[clamp(2rem,4.5vw,3.125rem)] leading-[1.12] font-extrabold text-navy uppercase">
            {t('title')}
          </h2>
        </div>

        <div className="grid gap-7 lg:grid-cols-2">
          {/* Path 1: ready to buy */}
          <div className={`${card} bg-brand text-white`}>
            <span className={`${tag} bg-white/20`}>{t('buy.tag')}</span>
            <h3 className={`mt-5 mb-3 max-w-[340px] leading-snug font-bold ${cardTitle}`}>
              {t('buy.title')}
            </h3>
            <p className="mb-8 max-w-[330px] leading-relaxed font-light text-white/80">
              {t('buy.text')}
            </p>
            <Link
              href="/login"
              className={`${btn} relative z-10 bg-accent text-white shadow-[0_12px_28px_rgba(253,158,1,0.35)]`}
            >
              {t('buy.button')}
              <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
            <Image
              src="/images/hero/carton-full-fat.webp"
              alt=""
              width={420}
              height={926}
              className="pointer-events-none absolute -right-2 -bottom-3 hidden h-[250px] w-auto sm:block lg:h-[200px] xl:h-[250px] drop-shadow-[0_18px_24px_rgba(0,0,0,0.3)]"
            />
          </div>

          {/* Path 2: still exploring → opens the floating AI chat */}
          <div className={`${card} bg-white text-heading shadow-[0_20px_50px_rgba(17,55,95,0.08)]`}>
            <span className={`${tag} bg-[#fff4e0] text-[#c77800]`}>{t('ai.tag')}</span>
            <h3 className={`mt-5 mb-3 max-w-[340px] leading-snug font-bold ${cardTitle}`}>
              {t('ai.title')}
            </h3>
            <p className="mb-8 max-w-[330px] leading-relaxed font-light text-muted">
              {t('ai.text')}
            </p>
            <OpenChatButton
              className={`${btn} relative z-10 bg-brand text-white shadow-[0_12px_28px_rgba(32,101,174,0.3)] hover:bg-brand-dark`}
            >
              {t('ai.button')}
              <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
            </OpenChatButton>
            <Image
              src="/images/about/cookies-milk-book.webp"
              alt=""
              width={800}
              height={534}
              className="pointer-events-none absolute right-0 bottom-0 hidden h-[220px] w-[240px] rounded-tl-3xl object-cover sm:block lg:h-[150px] lg:w-[170px] xl:h-[220px] xl:w-[240px]"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
