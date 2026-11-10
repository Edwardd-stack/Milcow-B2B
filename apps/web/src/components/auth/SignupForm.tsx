'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Lang, SignupInput } from '@milcow/shared';
import { useSignup } from '@/hooks/useAuth';
import { useRouter } from '@/i18n/navigation';
import { authErrorKey, nextPath } from './authError';
import { FormField } from './FormField';

const EMPTY = {
  memberCompanyName: '',
  memberNick: '',
  memberEmail: '',
  memberPassword: '',
  memberBizNo: '',
  memberPhone: '',
};

/** 1234567890 → 123-45-67890 while typing (the API expects this format) */
function formatBizNo(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 10);
  return [d.slice(0, 3), d.slice(3, 5), d.slice(5)].filter(Boolean).join('-');
}

export function SignupForm() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const router = useRouter();
  const signupMutation = useSignup();
  const [form, setForm] = useState(EMPTY);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({
      ...prev,
      [key]: key === 'memberBizNo' ? formatBizNo(e.target.value) : e.target.value,
    }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input: SignupInput = {
      memberCompanyName: form.memberCompanyName.trim(),
      memberNick: form.memberNick.trim(),
      memberEmail: form.memberEmail.trim(),
      memberPassword: form.memberPassword,
      // optional fields: send only when filled
      memberBizNo: form.memberBizNo || undefined,
      memberPhone: form.memberPhone.trim() || undefined,
      memberLang: locale.toUpperCase() as Lang,
    };
    signupMutation.mutate(input, { onSuccess: () => router.replace(nextPath()) });
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <FormField
        className="sm:col-span-2"
        label={t('fields.company')}
        autoComplete="organization"
        placeholder={t('placeholders.company')}
        required
        maxLength={100}
        value={form.memberCompanyName}
        onChange={set('memberCompanyName')}
      />
      <FormField
        label={t('fields.name')}
        autoComplete="name"
        placeholder={t('placeholders.name')}
        required
        maxLength={50}
        value={form.memberNick}
        onChange={set('memberNick')}
      />
      <FormField
        label={t('fields.phone')}
        type="tel"
        autoComplete="tel"
        placeholder="010-1234-5678"
        maxLength={20}
        value={form.memberPhone}
        onChange={set('memberPhone')}
      />
      <FormField
        className="sm:col-span-2"
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
        autoComplete="new-password"
        placeholder="••••••••"
        required
        minLength={8}
        maxLength={64}
        hint={t('hints.password')}
        value={form.memberPassword}
        onChange={set('memberPassword')}
      />
      <FormField
        label={t('fields.bizNo')}
        inputMode="numeric"
        placeholder="000-00-00000"
        pattern="\d{3}-\d{2}-\d{5}"
        hint={t('hints.bizNo')}
        value={form.memberBizNo}
        onChange={set('memberBizNo')}
      />

      {signupMutation.isError && (
        <p
          role="alert"
          className="rounded-xl bg-[#fdecea] px-4 py-3 text-sm text-[#b42318] sm:col-span-2"
        >
          {t(`errors.${authErrorKey(signupMutation.error)}`)}
        </p>
      )}

      <button
        type="submit"
        disabled={signupMutation.isPending}
        className="mt-2 h-[52px] rounded-full bg-brand font-semibold text-white shadow-[0_12px_26px_rgba(32,101,174,0.3)] transition hover:bg-navy disabled:opacity-60 sm:col-span-2"
      >
        {signupMutation.isPending ? t('signup.pending') : t('signup.submit')}
      </button>
    </form>
  );
}
