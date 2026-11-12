import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PrivacyView } from '@/components/privacy/PrivacyView';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/privacy'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Privacy' });
  return { title: `${t('title')} | Milcow`, description: t('intro') };
}

export default function PrivacyPage() {
  return <PrivacyView />;
}
