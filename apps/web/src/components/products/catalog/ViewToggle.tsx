'use client';

import { useTranslations } from 'next-intl';
import type { CatalogView } from './useCatalogParams';

/** Card / table switch — a white pill with a blue "thumb" that slides to the chosen side */
export function ViewToggle({
  view,
  onChange,
}: {
  view: CatalogView;
  onChange: (view: CatalogView) => void;
}) {
  const t = useTranslations('Catalog.view');
  const options = [
    {
      key: 'card' as const,
      icon: (
        <>
          <rect x="4" y="4" width="7" height="7" rx="2" />
          <rect x="13" y="4" width="7" height="7" rx="2" />
          <rect x="4" y="13" width="7" height="7" rx="2" />
          <rect x="13" y="13" width="7" height="7" rx="2" />
        </>
      ),
    },
    {
      key: 'table' as const,
      icon: (
        <>
          <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
          <path d="M3.5 9.5h17M3.5 14.5h17M9 9.5v10" />
        </>
      ),
    },
  ];

  return (
    <div
      role="radiogroup"
      aria-label={t('label')}
      className="relative grid grid-cols-2 rounded-full bg-white p-1 shadow-[0_8px_24px_rgba(17,55,95,0.08)] ring-1 ring-line"
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-linear-135 from-brand to-navy shadow-[0_6px_14px_rgba(32,101,174,0.35)] transition-transform duration-300 ease-out ${
          view === 'table' ? 'translate-x-full' : ''
        }`}
      />
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          role="radio"
          aria-checked={view === option.key}
          onClick={() => onChange(option.key)}
          className={`relative z-10 flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            view === option.key ? 'text-white' : 'text-muted hover:text-brand'
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-[18px] w-[18px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {option.icon}
          </svg>
          {t(option.key)}
        </button>
      ))}
    </div>
  );
}
