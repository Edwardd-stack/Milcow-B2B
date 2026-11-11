'use client';

import { useTranslations } from 'next-intl';
import type { ContractDraftResponse } from '@milcow/shared';
import { SparkIcon } from '@/components/icons';

const EXAMPLES = ['ex1', 'ex2', 'ex3'] as const;

/** Left column: describe the contract in your own words → the AI fills in the paper on the right */
export function AiAssistant({
  text,
  onText,
  onSubmit,
  pending,
  error,
  result,
}: {
  text: string;
  onText: (text: string) => void;
  onSubmit: () => void;
  pending: boolean;
  error: string | null;
  result: ContractDraftResponse | null;
}) {
  const t = useTranslations('Contracts.ai');

  return (
    <section className="rounded-3xl bg-white p-6 shadow-[0_14px_40px_rgba(17,55,95,0.08)] sm:p-8">
      <h2 className="flex items-center gap-3 text-lg font-bold text-heading">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-linear-135 from-brand to-navy text-white">
          <SparkIcon className="h-5 w-5" />
        </span>
        {t('title')}
      </h2>
      <p className="mt-2 mb-5 text-sm leading-relaxed text-muted">{t('lead')}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <label className="sr-only" htmlFor="contract-request">
          {t('title')}
        </label>
        <textarea
          id="contract-request"
          value={text}
          onChange={(e) => onText(e.target.value)}
          onKeyDown={(e) => {
            // ⌘/Ctrl + Enter sends, plain Enter makes a new line
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSubmit();
          }}
          maxLength={1000}
          rows={4}
          placeholder={t('placeholder')}
          className="w-full resize-none rounded-2xl border border-line px-4 py-3.5 text-[15px] leading-relaxed outline-none transition placeholder:text-soft focus:border-brand focus:ring-4 focus:ring-brand/12"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onText(t(`examples.${key}`))}
              className="rounded-full border border-brand/30 bg-brand/5 px-3.5 py-1.5 text-[13px] text-brand-dark transition hover:border-brand hover:bg-brand hover:text-white"
            >
              {t(`examples.${key}`)}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={pending || !text.trim()}
          className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-linear-135 from-brand to-navy font-semibold text-white shadow-[0_12px_26px_rgba(32,101,174,0.3)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
        >
          {pending ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <SparkIcon className="h-5 w-5" />
          )}
          {pending ? t('pending') : t('submit')}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-[#fdecea] px-4 py-3 text-sm text-[#b42318]">
          {error}
        </p>
      )}

      {result && (
        <div
          className="mt-5 rounded-2xl rounded-bl-md bg-cream px-4 py-3.5 text-sm leading-relaxed text-ink"
          aria-live="polite"
        >
          <p className="mb-1 flex items-center gap-1.5 font-semibold text-brand">
            <SparkIcon className="h-4 w-4" />
            {t('understood')}
          </p>
          {result.explanation}
          {result.issues.length > 0 && (
            <ul className="mt-2 space-y-1 text-[#9a5b00]">
              {result.issues.map((issue) => (
                <li key={issue.code}>⚠ {t(`issues.${issue.code}`)}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
