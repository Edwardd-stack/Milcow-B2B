import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AuthShell } from '@/components/auth/AuthShell';
import { RedirectIfLoggedIn } from '@/components/auth/RedirectIfLoggedIn';
import { SocialLoginError } from '@/components/auth/SocialLoginError';
import { LoginForm } from '@/components/auth/LoginForm';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/login'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Auth' });
  return { title: `${t('login.tab')} | Milcow` };
}

export default function LoginPage() {
  return (
    <AuthShell mode="login">
      <RedirectIfLoggedIn />
      {/* useSearchParams needs a Suspense boundary (the rest of the page is still pre-rendered) */}
      <Suspense fallback={null}>
        <SocialLoginError />
      </Suspense>
      <LoginForm />
    </AuthShell>
  );
}
