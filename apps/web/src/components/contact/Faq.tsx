'use client';

import { useTranslations } from 'next-intl';

const QUESTIONS = ['minOrder', 'pickup', 'delivery', 'contract', 'payment', 'ai'] as const;

/** FAQ — native <details>: opens/closes without JS state and works with the keyboard */
export function Faq() {
  const t = useTranslations('Contact.faq');
  return (
    <section className="mt-16 min-[100rem]:mt-28">
      <h2 className="text-center text-[28px] font-extrabold text-heading">{t('title')}</h2>
      <p className="mt-2 text-center text-muted">{t('text')}</p>
      <div className="mx-auto mt-8 max-w-3xl space-y-3">
        {QUESTIONS.map((key) => (
          <details
            key={key}
            className="group rounded-2xl bg-white shadow-[0_10px_30px_rgba(17,55,95,0.06)] open:shadow-[0_14px_40px_rgba(17,55,95,0.1)]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 font-semibold text-heading [&::-webkit-details-marker]:hidden">
              {t(`${key}.q`)}
              {/* Closed: arrow points down; open: it turns to point up */}
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cream text-brand transition group-open:rotate-180">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </summary>
            <p className="px-6 pb-5 leading-relaxed text-muted">{t(`${key}.a`)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
