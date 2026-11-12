import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SurplusView } from '@/components/surplus/SurplusView';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/surplus'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Surplus' });
  return { title: `${t('title')} | Milcow`, description: t('description') };
}

export default function SurplusPage() {
  return <SurplusView />;
}
