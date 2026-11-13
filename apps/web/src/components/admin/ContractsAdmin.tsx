'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ContractStatus, type ContractInfo, type Locale } from '@milcow/shared';
import { useAdminContracts, useContractReview } from '@/hooks/useAdmin';
import { formatKrw, formatTon } from '@/lib/format';
import { contractPdfUrl } from '@/services/contract.service';
import { AdminHeader, apiErrorText } from './AdminShell';

const TABS: (ContractStatus | 'ALL')[] = ['REVIEW', 'ACTIVE', 'CANCELLED', 'ALL'];

/** /admin/contracts — review queue first: approve, or reject with a reason the buyer will see */
export function ContractsAdmin() {
  const t = useTranslations('Admin');
  const tc = useTranslations('Contracts.list');
  const [tab, setTab] = useState<ContractStatus | 'ALL'>('REVIEW');
  const { data, isPending, isError } = useAdminContracts(tab === 'ALL' ? undefined : tab);
  const list = data?.list ?? [];

  return (
    <>
      <AdminHeader title={t('nav.contracts')} subtitle={t('contracts.subtitle')} />
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setTab(s)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === s ? 'bg-navy text-white' : 'bg-white text-heading hover:text-brand'
            }`}
          >
            {s === 'ALL'
              ? t('contracts.all')
              : s === 'REVIEW'
                ? t('contracts.queue')
                : tc(`status.${s}`)}
          </button>
        ))}
      </div>

      {isError ? (
        <p className="rounded-3xl bg-white p-10 text-center text-muted">{t('errors.generic')}</p>
      ) : isPending ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-3xl bg-white" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <p className="rounded-3xl bg-white p-12 text-center text-muted">
          {tab === 'REVIEW' ? t('contracts.queueEmpty') : t('contracts.empty')}
        </p>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {list.map((c) => (
            <ContractCard key={c.id} contract={c} />
          ))}
        </ul>
      )}
    </>
  );
}

function ContractCard({ contract: c }: { contract: ContractInfo }) {
  const t = useTranslations('Admin');
  const tc = useTranslations('Contracts.list');
  const locale = useLocale() as Locale;
  const review = useContractReview();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const error = apiErrorText(review.error, t);

  const rows = [
    [t('contracts.period'), `${c.contractStart} ~ ${c.contractEnd}`],
    [
      t('contracts.monthly'),
      `${formatTon(c.contractMonthlyTon)} t · ${formatKrw(c.contractPricePerTon, locale)}/t`,
    ],
    [
      t('contracts.deliveries'),
      t('contracts.deliveryCount', { count: c.contractDeliveryDates.length }),
    ],
    [t('contracts.warehouse'), c.warehouse.warehouseName[locale]],
    ...(c.services.length
      ? [[t('contracts.services'), c.services.map((s) => s.serviceName[locale]).join(', ')]]
      : []),
  ];

  return (
    <li className="flex flex-col rounded-3xl bg-white p-6 shadow-[0_14px_40px_rgba(17,55,95,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold text-heading">
            {c.customer?.companyName ?? c.customer?.nick ?? '—'}
          </p>
          <p className="truncate text-xs text-muted">
            {c.customer?.email}
            {c.customer?.phone && ` · ${c.customer.phone}`}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-cream px-3 py-1 text-xs font-semibold text-brand">
          {tc(`status.${c.contractStatus}`)}
        </span>
      </div>

      <p className="mt-4 text-lg font-extrabold text-heading">{c.product.productName[locale]}</p>
      <dl className="mt-2 space-y-1.5 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="shrink-0 text-muted">{label}</dt>
            <dd className="truncate text-right font-semibold text-heading">{value}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-4 border-t border-dashed border-line pt-2">
          <dt className="text-muted">{t('contracts.total')}</dt>
          <dd className="font-extrabold text-heading">{formatKrw(c.contractTotal, locale)}</dd>
        </div>
      </dl>

      {c.contractRejectReason && (
        <p className="mt-3 rounded-xl bg-[#fdecea] px-3 py-2 text-xs text-[#b42318]">
          {tc('rejected', { reason: c.contractRejectReason })}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-[#fdecea] px-3 py-2 text-sm text-[#b42318]">
          {error}
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <a
          href={contractPdfUrl(c.id, locale)}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-brand hover:border-brand"
        >
          📄 PDF
        </a>
        {c.contractStatus === 'REVIEW' && !rejecting && (
          <>
            <button
              type="button"
              disabled={review.isPending}
              onClick={() => review.mutate({ id: c.id, approve: true })}
              className="flex-1 rounded-full bg-[#2f8f4e] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              ✓ {t('contracts.approve')}
            </button>
            <button
              type="button"
              onClick={() => setRejecting(true)}
              className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted hover:border-[#b42318] hover:text-[#b42318]"
            >
              {t('contracts.reject')}
            </button>
          </>
        )}
      </div>

      {rejecting && (
        <form
          className="mt-3 space-y-2 rounded-2xl bg-[#fff6f5] p-3"
          onSubmit={(e) => {
            e.preventDefault();
            review.mutate(
              { id: c.id, reason: reason.trim() },
              { onSuccess: () => setRejecting(false) },
            );
          }}
        >
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            minLength={2}
            maxLength={300}
            rows={2}
            placeholder={t('contracts.reasonPlaceholder')}
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <div className="flex justify-end gap-2 text-sm">
            <button type="button" onClick={() => setRejecting(false)} className="px-3 text-muted">
              {t('back')}
            </button>
            <button
              type="submit"
              disabled={review.isPending || reason.trim().length < 2}
              className="rounded-full bg-[#b42318] px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              {t('contracts.confirmReject')}
            </button>
          </div>
        </form>
      )}
    </li>
  );
}
