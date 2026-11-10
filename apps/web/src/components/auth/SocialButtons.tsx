'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { SocialProvider } from '@milcow/shared';
import { socialStartUrl } from '@/services/auth.service';

/** "or" divider + Kakao and Google buttons (plain links: the API redirects to the provider) */
export function SocialButtons() {
  const t = useTranslations('Auth.social');
  const locale = useLocale();

  // Land where the visitor wanted to go (?next=/ko/contracts), otherwise the home page.
  // Read at click time (not during render) → server and browser render the same HTML.
  const go = (provider: SocialProvider) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const next = new URLSearchParams(window.location.search).get('next');
    window.location.href = socialStartUrl(provider, next?.startsWith('/') ? next : `/${locale}`);
  };
  const href = (provider: SocialProvider) => socialStartUrl(provider, `/${locale}`);

  const base =
    'flex h-[52px] items-center justify-center gap-2.5 rounded-full font-semibold transition hover:-translate-y-0.5';

  return (
    <div>
      <div className="my-6 flex items-center gap-3 text-[13px] text-soft before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
        {t('or')}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Kakao brand rules: #FEE500 background, black symbol, 85% black text */}
        <a
          href={href('kakao')}
          onClick={go('kakao')}
          className={`${base} bg-[#FEE500] text-black/85 hover:shadow-[0_10px_24px_rgba(254,229,0,0.45)]`}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              fill="#000"
              d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.9 5.3 4.7 6.7l-1 3.6c-.1.3.3.6.6.4l4.2-2.8c.5.1 1 .1 1.5.1 5.5 0 10-3.6 10-8S17.5 3 12 3z"
            />
          </svg>
          {t('kakao')}
        </a>
        <a
          href={href('google')}
          onClick={go('google')}
          className={`${base} border border-line bg-white text-heading hover:border-brand/30 hover:shadow-[0_10px_24px_rgba(17,55,95,0.1)]`}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z"
            />
            <path
              fill="#EA4335"
              d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z"
            />
          </svg>
          {t('google')}
        </a>
      </div>
    </div>
  );
}
