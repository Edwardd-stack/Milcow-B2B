import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ProfileView } from '@/components/profile/ProfileView';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/profile'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Profile' });
  return { title: `${t('title')} | Milcow`, description: t('description') };
}

export default function ProfilePage() {
  return <ProfileView />;
}
