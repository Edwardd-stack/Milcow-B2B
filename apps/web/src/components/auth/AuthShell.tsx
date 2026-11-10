import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Wave } from '@/components/ui/Wave';
import { Link } from '@/i18n/navigation';

/**
 * Frame for /login and /signup: a blue band with soft light, dots and floating cartons,
 * the hero wave below it, and the white form card in the middle.
 */
export function AuthShell({
  mode,
  children,
}: {
  mode: 'login' | 'signup';
  children: React.ReactNode;
}) {
  const t = useTranslations('Auth');
  const tabs = [
    { key: 'login', href: '/login' },
    { key: 'signup', href: '/signup' },
  ] as const;

  return (
    <section className="relative isolate overflow-x-clip bg-cream pb-18">
      {/* ── Blue band ── */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[400px] sm:h-[440px]">
        <div className="absolute inset-0 overflow-hidden bg-linear-150 from-brand via-brand to-navy">
          {/* Soft light spots */}
          <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-white/15 blur-3xl" />
          <div className="absolute top-20 right-[8%] h-72 w-72 rounded-full bg-accent/25 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-80 w-80 rounded-full bg-[#5fa8ff]/30 blur-3xl" />
          {/* Dot grid that fades out toward the edges */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.28)_1.4px,transparent_1.4px)] [mask-image:radial-gradient(ellipse_at_center,#000_20%,transparent_70%)] [background-size:22px_22px]" />
          {/* Thin rings */}
          <div className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full border border-white/10" />
          <div className="absolute -top-20 -right-20 h-[360px] w-[360px] rounded-full border border-white/10" />
          <div className="absolute -bottom-40 -left-32 h-[440px] w-[440px] rounded-full border border-white/10" />
        </div>

        {/* Floating cartons on wide screens */}
        <Image
          src="/images/hero/carton-semi-skimmed.webp"
          alt=""
          width={420}
          height={916}
          className="absolute top-28 left-[max(2rem,calc(50%-560px))] hidden h-52 w-auto -rotate-12 animate-float drop-shadow-2xl xl:block"
        />
        <Image
          src="/images/hero/carton-full-fat.webp"
          alt=""
          width={420}
          height={926}
          className="absolute top-36 right-[max(2rem,calc(50%-560px))] hidden h-60 w-auto rotate-[10deg] animate-float drop-shadow-2xl [animation-delay:-3s] xl:block"
        />

        <Wave fill="fill-cream" />
      </div>

      {/* ── Title ── */}
      <div className="px-5 pt-10 pb-9 text-center text-white sm:pt-12">
        <p className="mb-3 text-sm font-semibold tracking-[0.2em] text-[#ffd28a] uppercase">
          {t('eyebrow')}
        </p>
        <h1 className="text-[clamp(1.75rem,3.5vw,2.5rem)] leading-tight font-extrabold">
          {t(`${mode}.heading`)}
        </h1>
      </div>

      {/* ── Card ── */}
      <div
        className={`relative mx-4 rounded-[28px] bg-white p-7 shadow-[0_30px_70px_rgba(17,55,95,0.18)] sm:mx-auto sm:p-10 ${
          mode === 'signup' ? 'sm:max-w-[600px]' : 'sm:max-w-[460px]'
        }`}
      >
        {/* Login / Signup tabs */}
        <nav aria-label={t('tabs')} className="mb-7 flex rounded-full bg-cream p-1.5">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={mode === tab.key ? 'page' : undefined}
              className="flex-1 rounded-full py-2.5 text-center text-[15px] font-semibold text-muted transition hover:text-brand aria-[current=page]:bg-white aria-[current=page]:text-brand aria-[current=page]:shadow-[0_4px_12px_rgba(17,55,95,0.08)]"
            >
              {t(`${tab.key}.tab`)}
            </Link>
          ))}
        </nav>

        <h2 className="text-2xl font-extrabold text-navy">{t(`${mode}.title`)}</h2>
        <p className="mt-2 mb-7 text-[15px] text-muted">{t(`${mode}.lead`)}</p>

        {children}
      </div>
    </section>
  );
}
