import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AuthShell } from '@/components/auth/AuthShell';
import { SocialCompleteForm } from '@/components/auth/SocialCompleteForm';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/signup/complete'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Auth' });
  return { title: `${t('complete.title')} | Milcow` };
}

/** Step after the first Kakao / Google login: company details */
export default function SignupCompletePage() {
  return (
    <AuthShell mode="complete">
      <SocialCompleteForm />
    </AuthShell>
  );
}
