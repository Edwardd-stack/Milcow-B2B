'use client';

import { useTranslations } from 'next-intl';

/** 1 … 5 [6] 7 … 12 — first, last and the neighbours of the current page (all pages when there are ≤ 7) */
function pages(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1); // few pages → show them all
  const set = new Set(
    [1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total),
  );
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) out.push('…');
    out.push(p);
  });
  return out;
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const t = useTranslations('Catalog.pagination');
  if (totalPages <= 1) return null;

  const arrow =
    'grid h-11 w-11 place-items-center rounded-full bg-white text-heading shadow-[0_6px_16px_rgba(17,55,95,0.08)] transition hover:bg-brand hover:text-white disabled:pointer-events-none disabled:opacity-40';

  return (
    <nav aria-label={t('label')} className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label={t('prev')}
        className={arrow}
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
          <path d="m15 6-6 6 6 6" />
        </svg>
      </button>

      <ol className="flex items-center gap-1.5 rounded-full bg-white p-1.5 shadow-[0_6px_16px_rgba(17,55,95,0.08)]">
        {pages(page, totalPages).map((p, i) =>
          p === '…' ? (
            <li key={`gap-${i}`} aria-hidden="true" className="w-6 text-center text-soft">
              …
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                onClick={() => onChange(p)}
                aria-current={p === page ? 'page' : undefined}
                aria-label={t('page', { page: p })}
                className={`grid h-9 min-w-9 place-items-center rounded-full px-2 text-sm font-semibold transition ${
                  p === page
                    ? 'bg-linear-135 from-brand to-navy text-white shadow-[0_6px_14px_rgba(32,101,174,0.35)]'
                    : 'text-heading hover:bg-cream hover:text-brand'
                }`}
              >
                {p}
              </button>
            </li>
          ),
        )}
      </ol>

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label={t('next')}
        className={arrow}
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
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>
    </nav>
  );
}
