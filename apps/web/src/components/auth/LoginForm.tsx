'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useDemoLogin, useLogin } from '@/hooks/useAuth';
import { useRouter } from '@/i18n/navigation';
import { authErrorKey, nextPath } from './authError';
import { FormField } from './FormField';
import { SocialButtons } from './SocialButtons';

export function LoginForm() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const loginMutation = useLogin();
  const demoMutation = useDemoLogin();
  const [form, setForm] = useState({ memberEmail: '', memberPassword: '' });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(form, { onSuccess: () => router.replace(nextPath()) });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate={false}>
      <FormField
        label={t('fields.email')}
        type="email"
        autoComplete="email"
        placeholder="buyer@company.co.kr"
        required
        value={form.memberEmail}
        onChange={set('memberEmail')}
      />
      <FormField
        label={t('fields.password')}
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        required
        value={form.memberPassword}
        onChange={set('memberPassword')}
      />

      {(loginMutation.isError || demoMutation.isError) && (
        <p role="alert" className="rounded-xl bg-[#fdecea] px-4 py-2 text-sm text-[#b42318]">
          {t(`errors.${authErrorKey(loginMutation.error ?? demoMutation.error)}`)}
        </p>
      )}

      <button
        type="submit"
        disabled={loginMutation.isPending}
        className="mt-2 h-[52px] rounded-full bg-brand font-semibold text-white shadow-[0_12px_26px_rgba(32,101,174,0.3)] transition hover:bg-navy disabled:opacity-60"
      >
        {loginMutation.isPending ? t('login.pending') : t('login.submit')}
      </button>

      <SocialButtons />

      {/* Demo: one click logs in as a ready-made buyer (no password on the page) */}
      <button
        type="button"
        disabled={demoMutation.isPending}
        onClick={() =>
          demoMutation.mutate(undefined, { onSuccess: () => router.replace(nextPath()) })
        }
        className="mt-3 rounded-2xl border border-dashed border-brand/35 bg-brand/[0.04] px-4 py-3.5 text-left text-sm transition hover:border-brand hover:bg-brand/[0.08] disabled:opacity-60"
      >
        <span className="block font-semibold text-brand-dark">
          {demoMutation.isPending ? t('demo.pending') : t('demo.title')} →
        </span>
        <span className="mt-0.5 block text-muted">{t('demo.text')}</span>
      </button>
    </form>
  );
}
