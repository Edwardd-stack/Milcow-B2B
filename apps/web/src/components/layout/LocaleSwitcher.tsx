'use client';

import { useLocale, useTranslations } from 'next-intl';
import { LOCALES, type Locale } from '@milcow/shared';
import { usePathname, useRouter } from '@/i18n/navigation';

const LABELS: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
  uz: "O'zbekcha",
};

/** Switches the language but keeps the user on the same page. */
export function LocaleSwitcher() {
  const t = useTranslations('LocaleSwitcher');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav aria-label={t('label')} className="flex gap-2">
      {LOCALES.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => router.replace(pathname, { locale: item })}
          aria-current={item === locale ? 'true' : undefined}
          className={`rounded-full border px-4 py-1.5 text-sm transition ${
            item === locale
              ? 'border-foreground bg-foreground text-background'
              : 'border-zinc-300 hover:border-foreground'
          }`}
        >
          {LABELS[item]}
        </button>
      ))}
    </nav>
  );
}
