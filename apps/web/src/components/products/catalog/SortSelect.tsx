'use client';

import { useTranslations } from 'next-intl';
import { ProductSort, type ProductSort as Sort } from '@milcow/shared';

/** Sort as a pill-shaped native <select>: looks custom, keeps the phone's own picker and keyboard support */
export function SortSelect({ value, onChange }: { value: Sort; onChange: (sort: Sort) => void }) {
  const t = useTranslations('Catalog.sort');
  return (
    <label className="relative flex h-[42px] items-center rounded-full bg-white pr-3 pl-4 shadow-[0_8px_24px_rgba(17,55,95,0.08)] ring-1 ring-line transition focus-within:ring-2 focus-within:ring-brand">
      <svg
        viewBox="0 0 24 24"
        className="h-[18px] w-[18px] shrink-0 text-brand"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M7 4v16M3.5 16.5 7 20l3.5-3.5M17 20V4M13.5 7.5 17 4l3.5 3.5" />
      </svg>
      <span className="sr-only">{t('title')}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Sort)}
        className="h-full cursor-pointer appearance-none bg-transparent pr-7 pl-2 text-sm font-semibold text-heading outline-none"
      >
        {Object.values(ProductSort).map((sort) => (
          <option key={sort} value={sort}>
            {t(sort)}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute right-3.5 h-4 w-4 text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </label>
  );
}
