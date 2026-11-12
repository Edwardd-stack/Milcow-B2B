import { useTranslations } from 'next-intl';
import { Container } from '@/components/ui/Container';
import { Wave } from '@/components/ui/Wave';
import { Link } from '@/i18n/navigation';

/**
 * Template page banner for inner pages: big title, "Home / Page" breadcrumb, dots, the hero wave.
 * ≥1600px: the wave's height grows with the screen width (100/1440 of it = 6.95vw), so the bottom
 * padding grows with it too → the blue still reaches well below the title on big monitors.
 */
export function PageHero({
  title,
  current,
  parent,
}: {
  title: string;
  current: string;
  /** Optional middle step of the breadcrumb: Home / parent / current */
  parent?: { label: string; href: string };
}) {
  const t = useTranslations('Nav');
  return (
    <section className="relative isolate overflow-x-clip bg-brand pt-12 pb-28 text-center text-white sm:pt-14 sm:pb-32 min-[100rem]:pb-[calc(6.95vw+4rem)]">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(rgba(255,255,255,0.22)_1.3px,transparent_1.3px)] [mask-image:radial-gradient(ellipse_at_center,#000_10%,transparent_70%)] [background-size:22px_22px]"
      />
      <div
        aria-hidden="true"
        className="absolute -top-24 -left-24 -z-10 h-80 w-80 rounded-full bg-white/10 blur-3xl"
      />
      <Container>
        <h1 className="text-[clamp(2.25rem,5vw,3.25rem)] leading-tight font-extrabold uppercase">
          {title}
        </h1>
        <nav aria-label="breadcrumb" className="mt-3 text-sm text-white/75">
          <Link href="/" className="transition hover:text-white">
            {t('home')}
          </Link>
          <span className="mx-2">/</span>
          {parent && (
            <>
              <Link href={parent.href} className="transition hover:text-white">
                {parent.label}
              </Link>
              <span className="mx-2">/</span>
            </>
          )}
          <span aria-current="page" className="text-[#ffd28a]">
            {current}
          </span>
        </nav>
      </Container>
      <Wave fill="fill-cream" />
    </section>
  );
}
