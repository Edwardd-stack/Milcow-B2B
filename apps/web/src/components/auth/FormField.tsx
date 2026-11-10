'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';

type FieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: string;
  /** Small grey text under the input */
  hint?: string;
};

const inputClass =
  'h-[50px] w-full rounded-2xl border border-line bg-white px-4 text-[15px] text-ink outline-none transition placeholder:text-soft focus:border-brand focus:ring-4 focus:ring-brand/12';

/** Label + input. Password fields get a show/hide button. */
export function FormField({ label, hint, type = 'text', className = '', ...input }: FieldProps) {
  const t = useTranslations('Auth');
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-[13px] font-semibold text-heading">
        {label}
        {!input.required && <span className="ml-1 font-normal text-soft">({t('optional')})</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && visible ? 'text' : type}
          className={`${inputClass} ${isPassword ? 'pr-12' : ''}`}
          {...input}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? t('hidePassword') : t('showPassword')}
            className="absolute top-1/2 right-3 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-soft transition hover:bg-cream hover:text-brand"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              {visible && <path d="M3 3l18 18" />}
            </svg>
          </button>
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs text-soft">{hint}</p>}
    </div>
  );
}
