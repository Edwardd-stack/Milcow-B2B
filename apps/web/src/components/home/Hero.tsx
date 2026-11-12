import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { BasketIcon, SparkIcon, StoreIcon } from '@/components/icons';
import { Container } from '@/components/ui/Container';
import { Wave } from '@/components/ui/Wave';
import { Link } from '@/i18n/navigation';
import { RotatingWord } from './RotatingWord';

/** Home hero, laid out like the Milcow template: product visual left, big title right, wave below. */
export function Hero() {
  const t = useTranslations('Hero');
  const locale = useLocale();
  // Hangul looks smaller than Latin capitals at the same size → a bit bigger for ko
  const eyebrowText = locale === 'ko' ? 'text-base' : 'text-sm';
  const bodyText =
    locale === 'ko'
      ? 'text-[17px] leading-[1.85] sm:text-[19px]'
      : 'text-base leading-relaxed sm:text-lg';
  // ko: buttons a bit bigger and wider
  const primaryBtn = locale === 'ko' ? 'px-9 py-[18px] text-[17px]' : 'px-7 py-4';
  const secondaryBtn = locale === 'ko' ? 'py-1.5 pr-7 pl-1.5 text-[17px]' : 'py-1 pr-5 pl-1';
  const badgeSize = locale === 'ko' ? 'h-11 w-11' : 'h-10 w-10';

  return (
    <section
      // ≥1600px: the wave grows with the screen width (100/1440 of it), so the bottom padding grows too
      // → the visual never touches the wave on big monitors
      className="relative overflow-x-clip bg-brand pb-20 text-white sm:pb-24 lg:pb-22 xl:pb-32 min-[100rem]:pb-[calc(6.95vw+1rem)]"
    >
      {/* Two stacks pushed to opposite edges: visual hugs the left, text hugs the right.
          Sizes are relative (%, vw, clamp) so everything shrinks smoothly on 16" and smaller screens. */}
      <Container className="grid gap-14 pt-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-[90px] xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:pt-6 xl:pt-12">
        {/* From 1280px up: the visual is also capped by the screen HEIGHT, so the hero ends
            above the bottom of the first screen and the next section peeks in */}
        {/* Visual — positions measured from the template (% of a square frame):
            circle behind, milk splash wrapping around the cartons, two tilted cartons, two glass cards */}
        <div className="relative mx-auto aspect-square w-full max-w-[520px] lg:mx-0 lg:max-w-[700px] xl:-ml-12 xl:w-[calc(100%+3rem)] xl:max-w-[min(1000px,max(480px,calc(100svh-200px)))]">
          <div className="absolute top-[10%] left-[13%] aspect-square w-[66%] rounded-full bg-brand-dark/70" />
          <Image
            src="/images/hero/milk-splash.webp"
            alt=""
            width={764}
            height={704}
            className="absolute top-[17%] left-[12%] w-[82%]"
          />
          <Image
            src="/images/hero/carton-semi-skimmed.webp"
            alt={t('cartonAlt2')}
            width={420}
            height={916}
            className="absolute top-[21%] left-[53%] w-[27%] rotate-[3deg] drop-shadow-xl"
          />
          <Image
            src="/images/hero/carton-full-fat.webp"
            alt={t('cartonAlt1')}
            width={420}
            height={926}
            priority
            className="absolute top-[11%] left-[22%] w-[32%] -rotate-[4deg] drop-shadow-xl"
          />

          <GlassCard
            className="top-[30%] left-0 sm:left-[5%]"
            icon={<BasketIcon />}
            title={t('card1Title')}
            text={t('card1Text')}
          />
          <GlassCard
            className="top-[62%] right-0 sm:right-auto sm:left-[57%]"
            icon={<StoreIcon />}
            title={t('card2Title')}
            text={t('card2Text')}
          />
        </div>

        {/* Text */}
        <div>
          <p className={`mb-4 mt-22 font-semibold tracking-[0.2em] uppercase ${eyebrowText}`}>
            {t('eyebrow')}
          </p>
          {/* Template typography: 60px / 120px, weight 800, uppercase, letter-spacing 0.8px */}
          <h1 className="font-extrabold tracking-[0.8px] uppercase">
            <span className="block text-[clamp(2rem,9vw,3.75rem)] leading-[1.1] lg:text-[clamp(2.25rem,4.1vw,3.75rem)]">
              {t('title1')}
            </span>
            <span className="block text-[clamp(3rem,15vw,7.5rem)] leading-[1.05] lg:text-[clamp(4rem,7.6vw,7.5rem)]">
              {t('title2')} <RotatingWord words={[t('word1'), t('word2'), t('word3')]} />
            </span>
          </h1>
          <p className={`mt-6 max-w-[500px] text-white/90 ${bodyText}`}>{t('text')}</p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/products"
              className={`rounded-full bg-navy font-medium whitespace-nowrap ${primaryBtn} text-white shadow-lg transition hover:bg-brand-dark`}
            >
              {t('primary')}
            </Link>
            {/* Secondary button: outlined pill with the round star badge inside, a little lower than the primary */}
            <Link
              href="/contracts"
              className={`group flex items-center gap-3 rounded-full border border-white/50 bg-white/10 font-medium whitespace-nowrap shadow-lg transition hover:border-white hover:bg-white hover:text-brand ${secondaryBtn}`}
            >
              <span
                className={`flex items-center justify-center rounded-full border-2 ${badgeSize} border-white/80 ring-4 ring-white/10 transition group-hover:border-brand group-hover:ring-brand/10`}
              >
                <SparkIcon className="h-5 w-5" />
              </span>
              <span>
                {t.rich('secondary', {
                  b: (chunks) => <b className="mr-1 text-lg leading-none font-bold">{chunks}</b>,
                })}
              </span>
            </Link>
          </div>
        </div>
      </Container>

      <Wave fill="fill-cream" />

      {/* Scroll hint: tells visitors the page continues below (laptops only; big monitors show it anyway) */}
      <a
        href="#about"
        aria-label={t('scrollHint')}
        className="group absolute bottom-[calc(7vw+1.5rem)] left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs font-medium tracking-[0.2em] text-white/70 uppercase transition hover:text-white lg:flex min-[100rem]:hidden"
      >
        <span className="flex h-9 w-6 justify-center rounded-full border-2 border-current pt-1.5">
          <span className="h-2 w-1 animate-bounce rounded-full bg-current" />
        </span>
      </a>
    </section>
  );
}

function GlassCard({
  className,
  icon,
  title,
  text,
}: {
  className: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div
      className={`absolute flex items-center gap-3 rounded-md border border-white/25 bg-white/20 px-3.5 py-3 shadow-lg backdrop-blur-md ${className}`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#eaf2fd]">
        {icon}
      </span>
      <div>
        <p className="text-[15px] font-semibold whitespace-nowrap sm:text-lg xl:text-xl">{title}</p>
        <p className="text-xs whitespace-nowrap text-white/85 sm:text-sm">{text}</p>
      </div>
    </div>
  );
}
