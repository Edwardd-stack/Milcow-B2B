import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ContactView } from '@/components/contact/ContactView';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/contact'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Contact' });
  return { title: `${t('title')} | Milcow`, description: t('description') };
}

export default function ContactPage() {
  return <ContactView />;
}
