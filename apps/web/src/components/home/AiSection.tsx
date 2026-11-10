import { useLocale, useTranslations } from 'next-intl';
import { ChatPanel } from '@/components/ai/ChatPanel';
import { DoubleCheckIcon } from '@/components/icons';
import { Container } from '@/components/ui/Container';

/** "Ask our AI" — explanation left, a real working chat window right */
export function AiSection() {
  const t = useTranslations('AiSection');
  const locale = useLocale();
  const eyebrowText = locale === 'ko' ? 'text-[17px]' : 'text-base';
  const features = ['feature1', 'feature2', 'feature3'] as const;

  return (
    <section className="py-18 lg:py-20">
      <Container className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-[90px]">
        <div>
          <p className={`mb-4 font-semibold tracking-[0.2em] text-brand uppercase ${eyebrowText}`}>
            {t('eyebrow')}
          </p>
          <h2 className="text-[clamp(2rem,4.5vw,3.125rem)] leading-[1.12] font-extrabold text-navy uppercase">
            {t('title')}
          </h2>
          <p className="mt-6 leading-relaxed font-light text-muted">{t('text')}</p>

          <ul className="mt-8 space-y-4">
            {features.map((key) => (
              <li key={key} className="flex gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <DoubleCheckIcon className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold text-heading">{t(`${key}Title`)}</p>
                  <p className="mt-0.5 text-[15px] text-muted">{t(`${key}Text`)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <ChatPanel className="w-full lg:max-w-[540px] lg:justify-self-end" />
      </Container>
    </section>
  );
}
