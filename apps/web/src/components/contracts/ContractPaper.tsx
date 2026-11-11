'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { DeliveryType, ProductInfo, ServicePlanInfo, WarehouseInfo } from '@milcow/shared';
import { formatKrw, formatTon } from '@/lib/format';
import { MAX_MONTHS, monthlyDates, todayKst, type EditableContract } from './contract-utils';

type Locale = 'ko' | 'en' | 'uz';

export type PaperProblem = 'product' | 'warehouse' | 'start' | 'months' | 'ton' | 'address';

/** Which fields are still wrong / empty — the paper marks them and the buttons stay off */
export function paperProblems(
  c: EditableContract,
  product: ProductInfo | undefined,
): PaperProblem[] {
  const out: PaperProblem[] = [];
  if (!product) out.push('product');
  if (!c.warehouseId) out.push('warehouse');
  if (!c.start || c.start <= todayKst()) out.push('start');
  if (!(c.months >= 1 && c.months <= MAX_MONTHS)) out.push('months');
  if (!(c.ton > 0) || (product && c.ton < product.productMinOrderTon)) out.push('ton');
  if (c.deliveryType === 'DELIVERY' && !c.address.trim()) out.push('address');
  return out;
}

/**
 * Right column: the contract as a "paper". Read mode shows the terms; edit mode turns every
 * line into an input. Prices are an estimate from the catalog — the server fixes them on save.
 */
export function ContractPaper({
  value,
  onChange,
  editing,
  onEdit,
  products,
  warehouses,
  plans,
  onSave,
  saving,
  error,
}: {
  value: EditableContract;
  onChange: (patch: Partial<EditableContract>) => void;
  editing: boolean;
  onEdit: (editing: boolean) => void;
  products: ProductInfo[];
  warehouses: WarehouseInfo[];
  plans: ServicePlanInfo[];
  onSave: (submit: boolean) => void;
  saving: boolean;
  error: string | null;
}) {
  const t = useTranslations('Contracts.paper');
  const tp = useTranslations('Product');
  const locale = useLocale() as Locale;

  const product = products.find((p) => p.id === value.productId);
  const warehouse = warehouses.find((w) => w.id === value.warehouseId);
  const problems = paperProblems(value, product);
  const bad = (field: PaperProblem) => problems.includes(field);

  const dates =
    value.start && value.months > 0
      ? monthlyDates(value.start, Math.min(value.months, MAX_MONTHS))
      : [];
  const chosenPlans = plans.filter((p) => value.serviceIds.includes(p.id));
  const monthlyProduct = product ? Math.round(product.productPricePerTon * (value.ton || 0)) : 0;
  const monthlyServices = chosenPlans.reduce((sum, p) => sum + p.servicePrice, 0);
  const monthlyTotal = monthlyProduct + monthlyServices;

  const input =
    'h-10 w-full rounded-xl border bg-white px-3 text-sm text-heading outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/12';
  const ring = (field: PaperProblem) => (bad(field) ? 'border-accent' : 'border-line');

  const rows: {
    key: PaperProblem | 'delivery';
    label: string;
    view: string;
    edit: React.ReactNode;
  }[] = [
    {
      key: 'product',
      label: t('product'),
      view: product
        ? `${product.productName[locale]} · ${formatKrw(product.productPricePerTon, locale)}/${tp('ton')}`
        : '',
      edit: (
        <select
          value={value.productId}
          onChange={(e) => onChange({ productId: e.target.value })}
          className={`${input} ${ring('product')}`}
        >
          <option value="">{t('choose')}</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.productName[locale]} — {formatKrw(p.productPricePerTon, locale)}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'warehouse',
      label: t('warehouse'),
      view: warehouse ? warehouse.warehouseName[locale] : '',
      edit: (
        <select
          value={value.warehouseId}
          onChange={(e) => onChange({ warehouseId: e.target.value })}
          className={`${input} ${ring('warehouse')}`}
        >
          <option value="">{t('choose')}</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.warehouseName[locale]}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'start',
      label: t('start'),
      view: value.start,
      edit: (
        <input
          type="date"
          min={todayKst()}
          value={value.start}
          onChange={(e) => onChange({ start: e.target.value })}
          className={`${input} ${ring('start')}`}
        />
      ),
    },
    {
      key: 'months',
      label: t('months'),
      view: dates.length ? t('monthsValue', { count: dates.length, end: dates.at(-1)! }) : '',
      edit: (
        <input
          type="number"
          min={1}
          max={MAX_MONTHS}
          value={value.months || ''}
          onChange={(e) => onChange({ months: Number(e.target.value) })}
          className={`${input} ${ring('months')}`}
        />
      ),
    },
    {
      key: 'ton',
      label: t('ton'),
      view: value.ton > 0 ? `${formatTon(value.ton)} ${tp('ton')}` : '',
      edit: (
        <input
          type="number"
          min={product?.productMinOrderTon ?? 0.01}
          step="0.5"
          value={value.ton || ''}
          onChange={(e) => onChange({ ton: Number(e.target.value) })}
          className={`${input} ${ring('ton')}`}
        />
      ),
    },
    {
      key: 'delivery',
      label: t('delivery'),
      view:
        t(`deliveryType.${value.deliveryType}`) +
        (value.deliveryType === 'DELIVERY' && value.address ? ` · ${value.address}` : ''),
      edit: (
        <div className="space-y-2">
          <select
            value={value.deliveryType}
            onChange={(e) => onChange({ deliveryType: e.target.value as DeliveryType })}
            className={`${input} border-line`}
          >
            {(['PICKUP', 'DELIVERY'] as const).map((type) => (
              <option key={type} value={type}>
                {t(`deliveryType.${type}`)}
              </option>
            ))}
          </select>
          {value.deliveryType === 'DELIVERY' && (
            <input
              value={value.address}
              maxLength={200}
              placeholder={t('address')}
              onChange={(e) => onChange({ address: e.target.value })}
              className={`${input} ${ring('address')}`}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-[0_20px_50px_rgba(17,55,95,0.12)]">
      <header className="flex items-center justify-between gap-3 bg-linear-135 from-brand to-navy px-6 py-5 text-white">
        <div className="min-w-0">
          <p className="text-xs text-white/75">{t('kicker')}</p>
          <p className="mt-0.5 truncate text-lg font-bold">
            {product
              ? `${product.productName[locale]} · ${t('perMonth', { ton: formatTon(value.ton || 0) })}`
              : t('untitled')}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
          {t('draft')}
        </span>
      </header>

      <dl className="px-6 py-3">
        {rows.map((row) => {
          const missing = row.key !== 'delivery' && bad(row.key);
          return (
            <div
              key={row.key}
              className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-3 border-b border-line py-2.5 last:border-b-0"
            >
              <dt className="text-sm text-muted">{row.label}</dt>
              <dd className="min-w-0 text-right text-sm font-semibold text-heading">
                {editing ? (
                  row.edit
                ) : missing ? (
                  <button
                    type="button"
                    onClick={() => onEdit(true)}
                    className="rounded-full bg-[#fff4e0] px-2.5 py-0.5 text-xs font-semibold text-[#9a5b00] hover:underline"
                  >
                    {t(`problem.${row.key as PaperProblem}`)}
                  </button>
                ) : (
                  <span className="block truncate" title={row.view}>
                    {row.view}
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      {/* Add-on services */}
      <div className="px-6 pb-4">
        <p className="mb-2 text-sm text-muted">{t('services')}</p>
        <div className="flex flex-wrap gap-1.5">
          {(editing ? plans : chosenPlans).map((plan) => {
            const on = value.serviceIds.includes(plan.id);
            const label = `${plan.serviceName[locale]} +${formatKrw(plan.servicePrice, locale)}`;
            return editing ? (
              <button
                key={plan.id}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  onChange({
                    serviceIds: on
                      ? value.serviceIds.filter((id) => id !== plan.id)
                      : [...value.serviceIds, plan.id],
                  })
                }
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${on ? 'border-brand bg-brand text-white' : 'border-line text-muted hover:border-brand/40'}`}
              >
                {on ? '✓ ' : '+ '}
                {label}
              </button>
            ) : (
              <span
                key={plan.id}
                className="rounded-full bg-brand/8 px-3 py-1 text-xs font-medium text-brand"
              >
                ✓ {label}
              </span>
            );
          })}
          {!editing && chosenPlans.length === 0 && (
            <span className="text-xs text-soft">{t('noServices')}</span>
          )}
        </div>
      </div>

      {/* Totals — an estimate; the server recalculates from DB prices when saving */}
      <div className="mx-6 mb-5 rounded-2xl bg-cream px-5 py-4">
        <div className="flex justify-between text-sm text-muted">
          <span>{t('monthly')}</span>
          <span className="font-semibold text-heading">{formatKrw(monthlyTotal, locale)}</span>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-3">
          <span className="text-sm text-muted">{t('total', { count: dates.length })}</span>
          <span className="text-2xl font-extrabold text-heading">
            {formatKrw(monthlyTotal * dates.length, locale)}
          </span>
        </div>
        <p className="mt-1 text-right text-[11px] text-soft">{t('estimate')}</p>
      </div>

      {error && (
        <p
          role="alert"
          className="mx-6 mb-4 rounded-xl bg-[#fdecea] px-4 py-3 text-sm text-[#b42318]"
        >
          {error}
        </p>
      )}

      <footer className="flex flex-wrap gap-2.5 px-6 pb-6">
        <button
          type="button"
          onClick={() => onEdit(!editing)}
          className="h-12 flex-1 rounded-full border-[1.5px] border-brand px-5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
        >
          {editing ? t('done') : t('edit')}
        </button>
        <button
          type="button"
          disabled={problems.length > 0 || saving}
          onClick={() => onSave(true)}
          className="h-12 flex-[1.4] rounded-full bg-brand px-5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(32,101,174,0.3)] transition hover:bg-navy disabled:opacity-40 disabled:shadow-none"
        >
          {saving ? t('saving') : t('submit')}
        </button>
        <button
          type="button"
          disabled={problems.length > 0 || saving}
          onClick={() => onSave(false)}
          className="w-full text-center text-xs font-medium text-muted transition hover:text-brand disabled:opacity-40"
        >
          {t('saveDraft')}
        </button>
      </footer>
    </article>
  );
}
