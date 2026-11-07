import { useTranslations } from 'next-intl';
import { ApiStatus } from '@/components/home/ApiStatus';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';

export default function HomePage() {
  const t = useTranslations('HomePage');

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <LocaleSwitcher />
      <h1 className="text-4xl font-semibold tracking-tight">{t('title')}</h1>
      <p className="max-w-xl text-lg text-zinc-500">{t('subtitle')}</p>
      <ApiStatus />
    </main>
  );
}
