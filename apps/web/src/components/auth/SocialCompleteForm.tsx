'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Lang, SocialPendingInfo } from '@milcow/shared';
import { useCompleteSocial, useSocialPending } from '@/hooks/useAuth';
import { Link, useRouter } from '@/i18n/navigation';
import { authErrorKey } from './authError';
import { formatBizNo } from './formatBizNo';
import { FormField } from './FormField';

/** After the first Kakao / Google login: company details → account created → logged in */
export function SocialCompleteForm() {
  const t = useTranslations('Auth');
  const { data: pending, isPending } = useSocialPending();

  if (isPending) return <div className="h-64 animate-pulse rounded-2xl bg-cream" />;

  // Nothing waiting (expired after 30 min, or opened directly)
  if (!pending) {
    return (
      <div className="text-center">
        <p className="mb-6 text-muted">{t('complete.expired')}</p>
        <Link
          href="/login"
          className="inline-block rounded-full bg-brand px-8 py-3.5 font-semibold text-white transition hover:bg-navy"
        >
          {t('complete.backToLogin')}
        </Link>
      </div>
    );
  }

  // Separate component → its useState starts with the provider's data (no effect needed)
  return <Form pending={pending} />;
}

function Form({ pending }: { pending: SocialPendingInfo }) {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const router = useRouter();
  const completeMutation = useCompleteSocial();
  const [form, setForm] = useState({
    memberCompanyName: '',
    memberNick: pending.nick,
    memberEmail: pending.email ?? '',
    memberPhone: '',
    memberBizNo: '',
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({
      ...prev,
      [key]: key === 'memberBizNo' ? formatBizNo(e.target.value) : e.target.value,
    }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    completeMutation.mutate(
      {
        memberCompanyName: form.memberCompanyName.trim(),
        memberNick: form.memberNick.trim(),
        // a verified email from the provider is used as is — only send one when we asked for it
        memberEmail: pending.email ? undefined : form.memberEmail.trim(),
        memberPhone: form.memberPhone.trim() || undefined,
        memberBizNo: form.memberBizNo || undefined,
        memberLang: locale.toUpperCase() as Lang,
      },
      // next = full path from the API ("/ko/contracts") → plain navigation, not the locale-aware router
      { onSuccess: ({ next }) => router.replace(next.replace(/^\/(ko|en|uz)(?=\/|$)/, '') || '/') },
    );
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <p className="flex items-center gap-2 rounded-2xl bg-cream px-4 py-3 text-sm text-brand-dark sm:col-span-2">
        <span
          aria-hidden="true"
          className={`h-2.5 w-2.5 rounded-full ${pending.provider === 'kakao' ? 'bg-[#FEE500]' : 'bg-[#4285F4]'}`}
        />
        {t(`complete.connected.${pending.provider}`)}
      </p>

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
        label={t('fields.email')}
        type="email"
        autoComplete="email"
        placeholder="buyer@company.co.kr"
        required
        readOnly={!!pending.email}
        hint={pending.email ? t('complete.emailFromProvider') : undefined}
        value={form.memberEmail}
        onChange={set('memberEmail')}
      />
      <FormField
        label={t('fields.bizNo')}
        inputMode="numeric"
        placeholder="000-00-00000"
        pattern="\d{3}-\d{2}-\d{5}"
        value={form.memberBizNo}
        onChange={set('memberBizNo')}
      />

      {completeMutation.isError && (
        <p
          role="alert"
          className="rounded-xl bg-[#fdecea] px-4 py-3 text-sm text-[#b42318] sm:col-span-2"
        >
          {t(`errors.${authErrorKey(completeMutation.error)}`)}
        </p>
      )}

      <button
        type="submit"
        disabled={completeMutation.isPending}
        className="mt-2 h-[52px] rounded-full bg-brand font-semibold text-white shadow-[0_12px_26px_rgba(32,101,174,0.3)] transition hover:bg-navy disabled:opacity-60 sm:col-span-2"
      >
        {completeMutation.isPending ? t('complete.pending') : t('complete.submit')}
      </button>
    </form>
  );
}
