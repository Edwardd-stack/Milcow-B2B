'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { CopilotResponse, Locale } from '@milcow/shared';
import { useCopilot } from '@/hooks/useAdmin';
import { formatKrw } from '@/lib/format';
import { RobotIcon } from '@/components/icons';
import { AdminHeader, apiErrorText } from './AdminShell';

interface Turn {
  id: number;
  question: string;
  response?: CopilotResponse;
  error?: string;
}

const EXAMPLE_COUNT = 4;

/**
 * /admin/copilot — "데이터에게 묻기". The model only chooses one of four read-only tools;
 * the answer shows which tool ran, with which parameters, and the raw table.
 */
export function Copilot() {
  const t = useTranslations('Admin');
  const locale = useLocale() as Locale;
  const ask = useCopilot();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q || ask.isPending) return;
    const id = nextId.current++;
    setTurns((prev) => [...prev, { id, question: q }]);
    setQuestion('');
    ask.mutate(
      { question: q, locale },
      {
        onSuccess: (response) =>
          setTurns((prev) => prev.map((turn) => (turn.id === id ? { ...turn, response } : turn))),
        onError: (error) =>
          setTurns((prev) =>
            prev.map((turn) =>
              turn.id === id
                ? {
                    ...turn,
                    error:
                      (error as { status?: number }).status === 429
                        ? t('copilot.tooMany')
                        : (apiErrorText(error, t) ?? t('errors.generic')),
                  }
                : turn,
            ),
          ),
      },
    );
  };

  return (
    <>
      <AdminHeader title={t('nav.copilot')} subtitle={t('copilot.subtitle')} />

      <div className="flex min-h-[560px] flex-col rounded-3xl bg-white shadow-[0_14px_40px_rgba(17,55,95,0.06)]">
        <div className="flex-1 space-y-6 p-5 sm:p-6">
          {turns.length === 0 && (
            <div className="mx-auto max-w-xl py-8 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cream text-brand">
                <RobotIcon className="h-8 w-8" />
              </span>
              <p className="mt-4 font-bold text-heading">{t('copilot.emptyTitle')}</p>
              <p className="mt-1 text-sm text-muted">{t('copilot.emptyText')}</p>
            </div>
          )}

          {turns.map((turn) => (
            <div key={turn.id} className="space-y-3">
              <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-brand px-4 py-2.5 text-sm text-white">
                {turn.question}
              </p>
              <div className="max-w-full rounded-2xl rounded-bl-md bg-cream px-4 py-3 text-sm text-heading">
                {turn.error ? (
                  <p className="text-[#b42318]">{turn.error}</p>
                ) : !turn.response ? (
                  <p className="animate-pulse text-muted">{t('copilot.thinking')}</p>
                ) : (
                  <Answer response={turn.response} locale={locale} />
                )}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="border-t border-line p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap gap-2">
            {Array.from({ length: EXAMPLE_COUNT }, (_, i) => t(`copilot.examples.${i}`)).map(
              (ex) => (
                <button
                  key={ex}
                  type="button"
                  disabled={ask.isPending}
                  onClick={() => send(ex)}
                  className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-heading transition hover:border-brand hover:text-brand disabled:opacity-50"
                >
                  {ex}
                </button>
              ),
            )}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(question);
            }}
          >
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={300}
              placeholder={t('copilot.placeholder')}
              className="h-12 flex-1 rounded-full border border-line px-5 text-sm outline-none focus:border-brand"
            />
            <button
              type="submit"
              disabled={ask.isPending || question.trim().length < 2}
              className="h-12 rounded-full bg-brand px-6 text-sm font-semibold text-white hover:bg-navy disabled:opacity-50"
            >
              {t('copilot.ask')}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

function Answer({ response, locale }: { response: CopilotResponse; locale: Locale }) {
  const t = useTranslations('Admin');
  const cell = (column: string, value: string | number | null) => {
    if (value === null) return '—';
    if (column === 'revenue' && typeof value === 'number') return formatKrw(value, locale);
    if (column === 'ton' && typeof value === 'number') return `${value} t`;
    if (column === 'status' && typeof value === 'string') return t(`copilot.status.${value}`);
    return String(value);
  };

  return (
    <div className="space-y-3">
      <p className="leading-relaxed">{response.answer}</p>
      {response.tool && (
        <p className="font-mono text-[11px] text-muted">
          🔧 {t('copilot.usedTool')}: {response.tool}({JSON.stringify(response.params)})
        </p>
      )}
      {response.table && response.table.rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl bg-white">
          <table className="w-full text-xs">
            <thead className="text-left text-muted">
              <tr>
                {response.table.columns.map((c) => (
                  <th key={c} className="px-3 py-2 font-semibold">
                    {t(`copilot.col.${c}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {response.table.rows.map((row, i) => (
                <tr key={i} className="border-t border-line">
                  {row.map((value, j) => (
                    <td key={j} className="px-3 py-2 whitespace-nowrap">
                      {cell(response.table!.columns[j] ?? '', value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
