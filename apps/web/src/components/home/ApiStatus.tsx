'use client';

import { useTranslations } from 'next-intl';
import { useHealth } from '@/hooks/useHealth';

/** Small badge that shows whether apps/web can reach apps/api. */
export function ApiStatus() {
  const t = useTranslations('ApiStatus');
  const { data, isPending, isError } = useHealth();

  const state = isPending ? 'loading' : isError ? 'offline' : 'online';
  const dotColor = { loading: 'bg-zinc-400', offline: 'bg-red-500', online: 'bg-green-500' }[state];

  return (
    <div className="flex items-center gap-2 rounded-full border border-zinc-300 px-4 py-1.5 text-sm">
      <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} aria-hidden="true" />
      <span>
        {t('title')}: {t(state)}
        {data && ` · ${t('uptime', { seconds: data.uptimeSec })}`}
      </span>
    </div>
  );
}
