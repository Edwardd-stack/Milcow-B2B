'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { RobotIcon } from '@/components/icons';
import { ApiRequestError } from '@/lib/api-client';
import { useChatContext } from './ChatProvider';

const SUGGESTIONS = ['q1', 'q2', 'q3'] as const;

/**
 * A working chat window for the RAG chatbot (POST /ai/chat).
 * Used in the home AI section and in the floating chat widget — both share one conversation (ChatProvider).
 */
export function ChatPanel({
  className = '',
  listClassName = 'h-[340px]',
  onClose,
}: {
  className?: string;
  /** Height of the message list */
  listClassName?: string;
  /** Shows a close (✕) button in the header */
  onClose?: () => void;
}) {
  const t = useTranslations('Chat');
  const { messages, send, isPending, error } = useChatContext();
  const inputId = useId(); // two panels can be on one page → ids must be unique
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view (scroll only the message list, never the page)
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
  }, [messages, isPending]);

  const submit = (text: string) => {
    send(text);
    setInput('');
  };

  const errorText =
    error instanceof ApiRequestError && error.status === 429 ? t('errorRateLimit') : t('errorBusy');

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-3xl border border-white bg-white shadow-[0_20px_60px_rgba(17,55,95,0.12)] ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 bg-brand px-5 py-4 text-white">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand">
          <RobotIcon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold">{t('title')}</p>
          <p className="flex items-center gap-1.5 text-xs text-white/80">
            <span className="h-2 w-2 rounded-full bg-[#7ee08a]" aria-hidden="true" />
            {t('status')}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 transition hover:bg-white/25"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        className={`flex flex-col gap-3 overflow-y-auto bg-cream/60 px-5 py-5 ${listClassName}`}
      >
        <Bubble role="assistant">{t('welcome')}</Bubble>
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role}>
            {m.text}
          </Bubble>
        ))}
        {isPending && (
          <Bubble role="assistant">
            <span className="flex gap-1 py-1" aria-label={t('typing')}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-2 w-2 animate-bounce rounded-full bg-brand/60"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
          </Bubble>
        )}
        {error && !isPending && <p className="text-center text-sm text-[#c2410c]">{errorText}</p>}
      </div>

      {/* Suggested questions — one click shows the real answer */}
      <div className="flex flex-wrap gap-2 border-t border-line px-5 pt-4">
        {SUGGESTIONS.map((key) => (
          <button
            key={key}
            type="button"
            disabled={isPending}
            onClick={() => submit(t(key))}
            className="rounded-full border border-brand/30 bg-brand/5 px-3.5 py-1.5 text-sm text-brand-dark transition hover:border-brand hover:bg-brand hover:text-white disabled:opacity-50"
          >
            {t(key)}
          </button>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="flex items-center gap-2 px-5 py-4"
      >
        <label htmlFor={inputId} className="sr-only">
          {t('placeholder')}
        </label>
        <input
          id={inputId}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          placeholder={t('placeholder')}
          className="h-12 min-w-0 flex-1 rounded-full border border-line bg-cream/60 px-5 text-[15px] outline-none focus:border-brand focus:bg-white"
        />
        <button
          type="submit"
          disabled={isPending || !input.trim()}
          aria-label={t('send')}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand-dark disabled:opacity-40"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </form>
    </div>
  );
}

function Bubble({ role, children }: { role: 'user' | 'assistant'; children: React.ReactNode }) {
  const mine = role === 'user';
  return (
    <div
      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-line ${
        mine
          ? 'self-end rounded-br-md bg-brand text-white'
          : 'self-start rounded-bl-md bg-white text-ink shadow-sm'
      }`}
    >
      {children}
    </div>
  );
}
