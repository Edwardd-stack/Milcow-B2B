'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { ContractInfo, ContractStatus, Locale } from '@milcow/shared';
import { useContractAction, useContracts } from '@/hooks/useContracts';
import { formatKrw, formatTon } from '@/lib/format';
import { contractPdfUrl } from '@/services/contract.service';
import { todayKst } from './contract-utils';

const STATUS_STYLE: Record<ContractStatus, string> = {
  DRAFT: 'bg-[#eef1f5] text-muted',
  REVIEW: 'bg-[#fff4e0] text-[#b86e00]',
  ACTIVE: 'bg-[#e7f6ec] text-[#2f8f4e]',
  ENDED: 'bg-brand/10 text-brand',
  CANCELLED: 'bg-[#fdecea] text-[#b42318]',
};

/** "My contracts": status, delivery progress, next delivery, PDF and the next action */
export function ContractList() {
  const t = useTranslations('Contracts.list');
  const { data, isPending, isError } = useContracts();
  const contracts = data?.list ?? [];

  return (
    <section className="mt-14">
      <h2 className="mb-5 text-[22px] font-extrabold text-heading">
        {t('title')} <span className="font-medium text-muted">{contracts.length || ''}</span>
      </h2>
      {isError ? (
        <p className="rounded-2xl bg-white px-6 py-10 text-center text-muted">{t('error')}</p>
      ) : isPending ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[230px] animate-pulse rounded-3xl bg-white" />
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <p className="rounded-2xl bg-white px-6 py-10 text-center text-muted">{t('empty')}</p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {contracts.map((c) => (
            <ContractCard key={c.id} contract={c} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ContractCard({ contract: c }: { contract: ContractInfo }) {
  const t = useTranslations('Contracts.list');
  const tp = useTranslations('Product');
  const locale = useLocale() as Locale;
  const action = useContractAction();

  const today = todayKst();
  const done = c.contractDeliveryDates.filter((d) => d <= today).length;
  const total = c.contractDeliveryDates.length;
  const next = c.contractDeliveryDates.find((d) => d > today);
  const canSubmit = c.contractStatus === 'DRAFT';
  const canCancel = c.contractStatus === 'DRAFT' || c.contractStatus === 'REVIEW';

  const line =
    c.contractStatus === 'ACTIVE' && next
      ? t('progress', { done, total, next: next.slice(5).replace('-', '/') })
      : t(`hint.${c.contractStatus}`);

  const pill =
    'flex-1 rounded-full border border-line py-2 text-center text-[13px] font-semibold text-brand transition hover:border-brand hover:bg-brand hover:text-white disabled:opacity-40';

  return (
    <li className="flex flex-col rounded-3xl bg-white p-6 shadow-[0_14px_40px_rgba(17,55,95,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate font-bold text-heading">{c.product.productName[locale]}</p>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[c.contractStatus]}`}
        >
          {t(`status.${c.contractStatus}`)}
        </span>
      </div>
      <p className="mt-2 text-[22px] font-extrabold text-heading">
        {formatTon(c.contractMonthlyTon)} {tp('ton')}{' '}
        <span className="text-sm font-medium text-muted">/ {t('month')}</span>
      </p>
      <p className="text-sm text-muted">
        {c.contractStart} ~ {c.contractEnd}
      </p>
      <p className="mt-1 text-sm text-muted">
        {t('monthlyTotal')}{' '}
        <b className="text-heading">{formatKrw(c.contractMonthlyTotal, locale)}</b>
      </p>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-line">
        <span
          className="block h-full rounded-full bg-brand"
          style={{ width: `${total ? (done / total) * 100 : 0}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted">{line}</p>
      {c.contractStatus === 'CANCELLED' && c.contractRejectReason && (
        <p className="mt-3 rounded-xl bg-[#fdecea] px-3 py-2 text-xs text-[#b42318]">
          {t('rejected', { reason: c.contractRejectReason })}
        </p>
      )}

      <div className="mt-auto flex gap-2 pt-5">
        <a href={contractPdfUrl(c.id, locale)} target="_blank" rel="noreferrer" className={pill}>
          📄 PDF
        </a>
        {canSubmit && (
          <button
            type="button"
            disabled={action.isPending}
            onClick={() => action.mutate({ id: c.id, action: 'submit' })}
            className={pill}
          >
            {t('submit')}
          </button>
        )}
        {canCancel && (
          <button
            type="button"
            disabled={action.isPending}
            onClick={() => {
              if (window.confirm(t('cancelConfirm'))) action.mutate({ id: c.id, action: 'cancel' });
            }}
            className="rounded-full px-3 py-2 text-[13px] font-medium text-muted transition hover:text-[#b42318] disabled:opacity-40"
          >
            {t('cancel')}
          </button>
        )}
      </div>
    </li>
  );
}
