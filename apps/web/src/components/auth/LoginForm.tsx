'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useDemoLogin, useLogin } from '@/hooks/useAuth';
import { useRouter } from '@/i18n/navigation';
import type { DemoRole } from '@milcow/shared';
import { ROLE_HOME } from '@/hooks/useRole';
import { authErrorKey, nextPath } from './authError';
import { FormField } from './FormField';
import { SocialButtons } from './SocialButtons';

const DEMO_ROLES: DemoRole[] = ['BUYER', 'ADMIN', 'STAFF'];
const DEMO_ICON: Record<DemoRole, string> = { BUYER: '🏭', ADMIN: '🛠️', STAFF: '📦' };

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
    loginMutation.mutate(form, {
      onSuccess: ({ member }) =>
        router.replace(member.memberType === 'BUYER' ? nextPath() : ROLE_HOME[member.memberType]),
    });
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

      {/* Demo: one click → a ready-made account per role (no password on the page) */}
      <div className="mt-3 rounded-2xl border border-dashed border-brand/35 bg-brand/[0.04] p-4">
        <p className="text-sm font-semibold text-brand-dark">{t('demo.title')}</p>
        <p className="mt-0.5 text-xs text-muted">{t('demo.text')}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {DEMO_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              disabled={demoMutation.isPending}
              onClick={() =>
                demoMutation.mutate(role, {
                  // Buyer → back where they came from; admin / staff → their console
                  onSuccess: () => router.replace(role === 'BUYER' ? nextPath() : ROLE_HOME[role]),
                })
              }
              className="rounded-xl bg-white px-2 py-2.5 text-center text-xs font-semibold text-heading shadow-sm ring-1 ring-line transition hover:text-brand hover:ring-brand disabled:opacity-60"
            >
              <span className="block text-lg leading-none" aria-hidden="true">
                {DEMO_ICON[role]}
              </span>
              <span className="mt-1.5 block">
                {demoMutation.isPending && demoMutation.variables === role
                  ? t('demo.pending')
                  : t(`demo.role.${role}`)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
