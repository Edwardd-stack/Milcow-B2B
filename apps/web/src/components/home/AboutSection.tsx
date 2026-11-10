import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { DoubleCheckIcon, LayersIcon, ShopIcon } from '@/components/icons';
import { Container } from '@/components/ui/Container';
import { CountUp } from '@/components/ui/CountUp';
import { Link } from '@/i18n/navigation';

/** Demo marketing numbers (same in every language, so they live here, not in messages/*.json) */
const STATS = { years: 12, products: 20 } as const;

/** "About Milcow" — text left, stat cards + photos right (layout measured from the template) */
export function AboutSection() {
  const t = useTranslations('About');
  const locale = useLocale();
  const bodyText = locale === 'ko' ? 'text-[17px] leading-[1.85]' : 'text-base leading-relaxed';
  const points = ['point1', 'point2', 'point3'] as const;

  return (
    <section className="py-12 lg:py-14">
      <Container className="grid items-center gap-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-[90px]">
        {/* Text */}
        <div>
          <p className="mb-4 font-semibold tracking-[0.2em] text-brand uppercase">{t('eyebrow')}</p>
          <h2 className="text-[clamp(2rem,5.5vw,3.125rem)] leading-[1.12] font-extrabold tracking-[0.5px] text-navy uppercase">
            {t('title')}
          </h2>
          <p className={`mt-6 font-light text-muted ${bodyText}`}>{t('text')}</p>

          <ul className="mt-7 space-y-3">
            {points.map((key) => (
              <li key={key} className="flex items-start gap-3 text-[15px] text-ink">
                <DoubleCheckIcon className="mt-1 h-4 w-4 shrink-0 text-brand" />
                {t(key)}
              </li>
            ))}
          </ul>

          <Link
            href="/about"
            className="mt-8 inline-block rounded-full bg-brand-dark px-9 py-3.5 font-medium text-white shadow-lg transition hover:bg-navy"
          >
            {t('button')}
          </Link>
        </div>

        {/* Visual — every box is a % of this frame, so the whole composition scales as one */}
        <div className="relative mx-auto aspect-[398/435] w-full max-w-[490px] lg:mr-0">
          {/* Decorations (behind) */}
          <div className="absolute top-0 left-[34%] aspect-square w-[65%] rounded-full bg-[#e3ecf8]" />
          <div className="absolute top-[68.5%] left-[20.6%] h-[31.5%] w-[35%] rounded-xl bg-[#b5cbe6]" />
          <div className="absolute top-[82%] left-[83%] h-[15.6%] w-[17%] rounded-lg bg-[#9fb8dc]" />

          <StatCard
            className="top-[7%] left-0 h-[41%] w-[45%]"
            tile="bg-[#e8f1fc] text-brand"
            icon={<ShopIcon />}
            value={STATS.years}
            plusColor="text-brand"
            label={t('statYears')}
          />
          <Photo
            className="top-[20.5%] left-[51%] w-[45%]"
            src="/images/news/boy-milk-cookies.webp"
            alt={t('photo1Alt')}
          />
          <Photo
            className="top-[54%] left-0 w-[45%]"
            src="/images/about/cookies-milk-book.webp"
            alt={t('photo2Alt')}
          />
          <StatCard
            className="top-[53.8%] left-[51%] h-[41.8%] w-[45%]"
            tile="bg-[#e9fae4] text-[#5f9f45]"
            icon={<LayersIcon />}
            value={STATS.products}
            plusColor="text-[#5f9f45]"
            label={t('statProducts')}
          />
        </div>
      </Container>
    </section>
  );
}

function StatCard({
  className,
  tile,
  icon,
  value,
  plusColor,
  label,
}: {
  className: string;
  tile: string;
  icon: React.ReactNode;
  value: number;
  plusColor: string;
  label: string;
}) {
  return (
    // Frosted glass like the template: white fading to transparent + blur,
    // so the blue squares behind show through softly
    <div
      className={`absolute flex flex-col items-center rounded-md border border-white/80 bg-gradient-to-br from-white/70 via-white/40 to-white/15 p-[7%] text-center shadow-[0_8px_24px_rgba(17,55,95,0.04)] backdrop-blur-md ${className}`}
    >
      <span className={`flex h-[34%] w-full items-center justify-center rounded-md ${tile}`}>
        {icon}
      </span>
      <p className="mt-[9%] flex items-center text-[clamp(2rem,3.8vw,2.625rem)] leading-none font-bold text-heading">
        <CountUp to={value} />
        <span className={`ml-2.5 text-xl font-light ${plusColor}`}>+</span>
      </p>
      <p className="mt-2.5 text-sm text-heading sm:text-[15px]">{label}</p>
    </div>
  );
}

function Photo({ className, src, alt }: { className: string; src: string; alt: string }) {
  return (
    <div className={`absolute aspect-[3/2] overflow-hidden rounded-md shadow-lg ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 245px, 45vw"
        className="object-cover"
      />
    </div>
  );
}
