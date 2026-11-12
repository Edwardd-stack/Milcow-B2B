import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PassportSearch } from '@/components/passport/PassportSearch';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/passport'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Passport' });
  return { title: `${t('title')} | Milcow`, description: t('description') };
}

export default function PassportPage() {
  return <PassportSearch />;
}
