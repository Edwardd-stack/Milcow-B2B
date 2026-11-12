'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

/** /login?error=social — the API sends the user back here when Kakao / Google login failed */
export function SocialLoginError() {
  const t = useTranslations('Auth.social');
  const failed = useSearchParams().get('error') === 'social';
  if (!failed) return null;
  return (
    <p role="alert" className="mb-5 rounded-xl bg-[#fdecea] px-4 py-3 text-sm text-[#b42318]">
      {t('error')}
    </p>
  );
}
