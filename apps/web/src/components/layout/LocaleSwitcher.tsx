'use client';

import { useLocale, useTranslations } from 'next-intl';
import { LOCALES } from '@milcow/shared';
import { usePathname, useRouter } from '@/i18n/navigation';

/** Compact KO / EN / UZ switch. Keeps the user on the same page. */
export function LocaleSwitcher() {
  const t = useTranslations('LocaleSwitcher');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div role="group" aria-label={t('label')} className="flex rounded-full bg-white/10 p-1">
      {LOCALES.map((item) => {
        const active = item === locale;
        return (
          <button
            key={item}
            type="button"
            lang={item}
            onClick={() => router.replace(pathname, { locale: item })}
            aria-pressed={active}
            className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap uppercase transition ${
              active ? 'bg-white text-brand-dark' : 'text-white/80 hover:text-white'
            }`}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}
