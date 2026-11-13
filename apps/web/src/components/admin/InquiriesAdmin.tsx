'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { InquiryStatus } from '@milcow/shared';
import { useInquiries, useMarkAnswered } from '@/hooks/useAdmin';
import { AdminHeader, apiErrorText } from './AdminShell';

/** /admin/inquiries — contact-form inbox. Replies go out by e-mail; here we only track them. */
export function InquiriesAdmin() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const [tab, setTab] = useState<InquiryStatus>('NEW');
  const { data, isPending, isError } = useInquiries(tab);
  const mark = useMarkAnswered();
  const error = apiErrorText(mark.error, t);

  const date = (iso: string) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: 'Asia/Seoul',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));

  return (
    <>
      <AdminHeader title={t('nav.inquiries')} subtitle={t('inquiries.subtitle')} />
      <div className="mb-4 flex gap-2">
        {(['NEW', 'ANSWERED'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setTab(s)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === s ? 'bg-navy text-white' : 'bg-white text-heading hover:text-brand'
            }`}
          >
            {t(`inquiries.${s}`)}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-[#fdecea] px-4 py-3 text-sm text-[#b42318]">
          {error}
        </p>
      )}

      {isError ? (
        <p className="rounded-3xl bg-white p-10 text-center text-muted">{t('errors.generic')}</p>
      ) : isPending ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-3xl bg-white" />
          ))}
        </div>
      ) : data.list.length === 0 ? (
        <p className="rounded-3xl bg-white p-12 text-center text-muted">{t('inquiries.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {data.list.map((q) => (
            <li
              key={q.id}
              className="rounded-3xl bg-white p-5 shadow-[0_14px_40px_rgba(17,55,95,0.06)] sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-heading">
                    {q.inquiryName}
                    {q.inquiryCompany && (
                      <span className="font-normal text-muted"> · {q.inquiryCompany}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted">
                    {q.inquiryEmail} · {date(q.createdAt)}
                  </p>
                </div>
                {q.inquiryStatus === 'ANSWERED' && q.inquiryAnsweredAt && (
                  <span className="rounded-full bg-[#e7f6ec] px-3 py-1 text-xs font-semibold text-[#2f8f4e]">
                    ✓ {date(q.inquiryAnsweredAt)}
                    {q.inquiryAnsweredBy && ` · ${q.inquiryAnsweredBy}`}
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-heading">
                {q.inquiryMessage}
              </p>
              {q.inquiryStatus === 'NEW' && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {/* A masked address (demo session) can't be mailed — the button is hidden then */}
                  {!q.inquiryEmail.includes('***') && (
                    <a
                      href={`mailto:${q.inquiryEmail}?subject=${encodeURIComponent(`[Milcow] ${t('inquiries.replySubject')}`)}`}
                      className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-brand hover:border-brand"
                    >
                      ✉️ {t('inquiries.reply')}
                    </a>
                  )}
                  <button
                    type="button"
                    disabled={mark.isPending}
                    onClick={() => mark.mutate(q.id)}
                    className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-navy disabled:opacity-50"
                  >
                    {t('inquiries.markAnswered')}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
