'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLogin } from '@/hooks/useAuth';
import { useRouter } from '@/i18n/navigation';
import { authErrorKey, nextPath } from './authError';
import { FormField } from './FormField';

// Seed account (apps/api/prisma/seed) — shown so a visitor can try the platform at once
const DEMO = { memberEmail: 'buyer@milcow.test', memberPassword: 'Milcow1234!' };

export function LoginForm() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const loginMutation = useLogin();
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

      {loginMutation.isError && (
        <p role="alert" className="rounded-xl bg-[#fdecea] px-4 py-2 text-sm text-[#b42318]">
          {t(`errors.${authErrorKey(loginMutation.error)}`)}
        </p>
      )}

      <button
        type="submit"
        disabled={loginMutation.isPending}
        className="mt-2 h-[52px] rounded-full bg-brand font-semibold text-white shadow-[0_12px_26px_rgba(32,101,174,0.3)] transition hover:bg-navy disabled:opacity-60"
      >
        {loginMutation.isPending ? t('login.pending') : t('login.submit')}
      </button>

      {/* Demo account: one click fills the form */}
      <button
        type="button"
        onClick={() => setForm(DEMO)}
        className="mt-3 rounded-2xl border border-dashed border-brand/35 bg-brand/[0.04] px-4 py-3 text-left text-sm text-brand-dark transition hover:border-brand hover:bg-brand/[0.08]"
      >
        <span className="block font-semibold">{t('demo.title')}</span>
        <span className="text-muted">
          {DEMO.memberEmail} · {DEMO.memberPassword}
        </span>
        <span className="mt-1 block text-xs text-brand">{t('demo.fill')}</span>
      </button>
    </form>
  );
}
