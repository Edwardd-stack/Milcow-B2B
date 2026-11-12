'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale, PickupInfo, PickupStatus } from '@milcow/shared';
import { usePickupLookup, usePickups, usePickupStep } from '@/hooks/useAdmin';
import { PickupStatusBadge } from '@/components/orders/StatusBadge';
import { QrScanner, useCanScanQr } from '@/components/ui/QrScanner';
import { AdminHeader, apiErrorText, Card } from './AdminShell';

const STEPS: PickupStatus[] = ['SCHEDULED', 'LOADING', 'READY', 'PICKED_UP'];
const todayKst = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());

/**
 * /admin/pickup — the warehouse gate, made for a phone:
 * scan the driver's QR (or type the code) → one big button per step.
 */
export function PickupGate() {
  const t = useTranslations('Admin');
  const locale = useLocale() as Locale;
  const canScan = useCanScanQr();
  const [scanning, setScanning] = useState(false);
  const [code, setCode] = useState('');
  const lookup = usePickupLookup();
  const step = usePickupStep();
  const [current, setCurrent] = useState<PickupInfo | null>(null);
  const today = todayKst();
  const { data: todays } = usePickups(today);

  const find = (value: string) => {
    const clean = value.trim().toUpperCase();
    if (!clean) return;
    setCode(clean);
    lookup.mutate(clean, { onSuccess: setCurrent, onError: () => setCurrent(null) });
  };

  const index = current ? STEPS.indexOf(current.pickupStatus) : -1;
  const next = index >= 0 && index < STEPS.length - 1 ? STEPS[index + 1] : null;
  const time = (iso: string) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: 'Asia/Seoul',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  const error = lookup.isError
    ? (lookup.error as { status?: number }).status === 404
      ? t('pickup.notFound')
      : apiErrorText(lookup.error, t)
    : apiErrorText(step.error, t);

  return (
    <>
      <AdminHeader title={t('nav.pickup')} subtitle={t('pickup.subtitle')} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <Card>
            <form
              className="flex flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                find(code);
              }}
            >
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="MC-7KQ2XP"
                autoCapitalize="characters"
                className="h-14 flex-1 rounded-2xl border border-line px-4 font-mono text-xl font-bold tracking-[0.15em] text-heading outline-none focus:border-brand"
              />
              <button
                type="submit"
                disabled={lookup.isPending}
                className="h-14 rounded-2xl bg-navy px-6 font-semibold text-white disabled:opacity-50"
              >
                {t('pickup.find')}
              </button>
              {canScan && (
                <button
                  type="button"
                  onClick={() => setScanning(true)}
                  className="h-14 rounded-2xl bg-brand px-6 font-semibold text-white"
                >
                  📷 {t('pickup.scan')}
                </button>
              )}
            </form>
            {scanning && (
              <div className="mt-4">
                <QrScanner
                  onResult={(value) => {
                    setScanning(false);
                    find(value);
                  }}
                  onClose={() => setScanning(false)}
                />
              </div>
            )}
            {error && (
              <p
                role="alert"
                className="mt-3 rounded-xl bg-[#fdecea] px-4 py-3 text-sm text-[#b42318]"
              >
                {error}
              </p>
            )}
          </Card>

          {current && (
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-2xl font-extrabold tracking-[0.15em] text-heading">
                    {current.pickupCode}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {current.warehouse.warehouseName[locale]} · {time(current.slot.slotStart)}–
                    {time(current.slot.slotEnd)}
                    {current.pickupVehicleNo && ` · 🚚 ${current.pickupVehicleNo}`}
                  </p>
                  <p className="text-xs text-soft">#{current.orderId.slice(-8).toUpperCase()}</p>
                </div>
                <PickupStatusBadge status={current.pickupStatus} />
              </div>

              {/* Stepper */}
              <ol className="mt-6 grid grid-cols-4 gap-2">
                {STEPS.map((s, i) => (
                  <li key={s} className="text-center">
                    <span
                      className={`mx-auto grid h-9 w-9 place-items-center rounded-full text-sm font-bold ${
                        i <= index ? 'bg-brand text-white' : 'bg-cream text-muted'
                      }`}
                    >
                      {i < index || index === STEPS.length - 1 ? '✓' : i + 1}
                    </span>
                    <span
                      className={`mt-1.5 block text-xs font-semibold ${i <= index ? 'text-heading' : 'text-muted'}`}
                    >
                      {t(`pickup.step.${s}`)}
                    </span>
                  </li>
                ))}
              </ol>

              {next ? (
                <button
                  type="button"
                  disabled={step.isPending}
                  onClick={() =>
                    step.mutate({ id: current.id, status: next }, { onSuccess: setCurrent })
                  }
                  className="mt-6 h-16 w-full rounded-2xl bg-brand text-lg font-extrabold text-white shadow-[0_12px_26px_rgba(32,101,174,0.3)] transition hover:bg-navy disabled:opacity-50"
                >
                  {step.isPending ? '…' : `${t(`pickup.action.${next}`)} →`}
                </button>
              ) : (
                <p className="mt-6 rounded-2xl bg-[#e7f6ec] px-4 py-4 text-center font-bold text-[#2f8f4e]">
                  ✓ {t('pickup.done')}
                </p>
              )}
            </Card>
          )}
        </div>

        <Card>
          <h2 className="font-bold text-heading">
            {t('pickup.today', { date: today.slice(5).replace('-', '/') })}
          </h2>
          {!todays || todays.list.length === 0 ? (
            <p className="mt-4 text-sm text-muted">{t('pickup.noneToday')}</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {todays.list
                .slice()
                .sort((a, b) => a.slot.slotStart.localeCompare(b.slot.slotStart))
                .map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => find(p.pickupCode)}
                      className="flex w-full items-center gap-3 py-2.5 text-left text-sm hover:bg-cream/60"
                    >
                      <span className="w-12 shrink-0 font-semibold text-heading">
                        {time(p.slot.slotStart)}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-mono">{p.pickupCode}</span>
                      <PickupStatusBadge status={p.pickupStatus} />
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
