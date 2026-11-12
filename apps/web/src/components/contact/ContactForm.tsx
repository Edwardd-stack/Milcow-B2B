'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FormField } from '@/components/auth/FormField';
import { useMe } from '@/hooks/useAuth';
import { useCreateInquiry } from '@/hooks/useInquiry';
import { ApiRequestError } from '@/lib/api-client';

const MESSAGE_MAX = 2000; // same limit as the API's CreateInquiryDto

/** Contact form. Logged-in members get their name / email / company filled in. */
export function ContactForm() {
  const t = useTranslations('Contact.form');
  const { data: member } = useMe();
  const send = useCreateInquiry();

  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
  const [prefilled, setPrefilled] = useState(false);
  if (member && !prefilled) {
    // derive once from data during render (same pattern as the contracts page)
    setPrefilled(true);
    setForm((f) => ({
      ...f,
      name: f.name || member.memberNick,
      email: f.email || member.memberEmail,
      company: f.company || (member.memberCompanyName ?? ''),
    }));
  }

  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (send.isPending) return;
    send.mutate(
      {
        inquiryName: form.name.trim(),
        inquiryEmail: form.email.trim(),
        inquiryCompany: form.company.trim() || undefined,
        inquiryMessage: form.message.trim(),
      },
      { onSuccess: () => setForm((f) => ({ ...f, message: '' })) },
    );
  };

  const error = send.isError
    ? send.error instanceof ApiRequestError && send.error.status === 429
      ? t('rateLimit')
      : send.error instanceof ApiRequestError && send.error.status === 400
        ? t('invalid')
        : t('error')
    : null;

  if (send.isSuccess) {
    return (
      <div role="status" className="mt-8 rounded-2xl bg-[#e7f6ec] px-6 py-10 text-center">
        <p className="text-lg font-bold text-[#2f8f4e]">✓ {t('sent')}</p>
        <p className="mt-1 text-sm text-muted">{t('sentText')}</p>
        <button
          type="button"
          onClick={() => send.reset()}
          className="mt-5 rounded-full border border-brand px-6 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
        >
          {t('again')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-7 grid gap-4 sm:grid-cols-2">
      <FormField
        label={t('name')}
        value={form.name}
        onChange={set('name')}
        required
        maxLength={50}
        autoComplete="name"
      />
      <FormField
        label={t('email')}
        type="email"
        value={form.email}
        onChange={set('email')}
        required
        maxLength={100}
        autoComplete="email"
      />
      <FormField
        label={t('company')}
        value={form.company}
        onChange={set('company')}
        maxLength={100}
        autoComplete="organization"
        className="sm:col-span-2"
      />
      <label className="block sm:col-span-2">
        <span className="mb-2 block text-[13px] font-semibold text-heading">{t('message')}</span>
        <textarea
          value={form.message}
          onChange={set('message')}
          required
          maxLength={MESSAGE_MAX}
          rows={6}
          placeholder={t('messagePlaceholder')}
          className="w-full resize-y rounded-2xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-soft focus:border-brand focus:ring-4 focus:ring-brand/12"
        />
        <span className="mt-1 block text-right text-xs text-soft">
          {form.message.length} / {MESSAGE_MAX}
        </span>
      </label>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-[#fdecea] px-4 py-3 text-sm text-[#b42318] sm:col-span-2"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={send.isPending}
        className="h-[54px] rounded-full bg-brand font-semibold text-white shadow-[0_12px_26px_rgba(32,101,174,0.3)] transition hover:bg-navy disabled:opacity-60 sm:col-span-2"
      >
        {send.isPending ? t('sending') : t('send')}
      </button>
    </form>
  );
}
