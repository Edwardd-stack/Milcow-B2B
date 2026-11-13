'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  LOCALES,
  ProductGrade,
  ProductStatus,
  ProductType,
  type Locale,
  type LocalizedText,
  type ProductAdminInfo,
  type ProductAdminInput,
} from '@milcow/shared';
import { useSaveProduct } from '@/hooks/useAdmin';
import { useWarehouses } from '@/hooks/useLocations';
import { useRole } from '@/hooks/useRole';
import { Link, useRouter } from '@/i18n/navigation';
import { AdminHeader, apiErrorText, Card } from './AdminShell';

const EMPTY_TEXT: LocalizedText = { ko: '', en: '', uz: '' };
const LANG_LABEL: Record<Locale, string> = { ko: '한국어', en: 'English', uz: "O'zbek" };

/** New product (no `product`) or edit. The SKU is given by the server. */
export function ProductForm({ product }: { product?: ProductAdminInfo }) {
  const t = useTranslations('Admin');
  const tp = useTranslations('Product');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { isDemo } = useRole();
  const { data: warehouses } = useWarehouses();
  const save = useSaveProduct();

  const [form, setForm] = useState(() => ({
    productType: product?.productType ?? ProductType.RAW_MILK,
    productGrade: product?.productGrade ?? ProductGrade.GRADE_1,
    productStatus: product?.productStatus ?? ProductStatus.ACTIVE,
    productName: product?.productName ?? EMPTY_TEXT,
    productDesc: product?.productDesc ?? EMPTY_TEXT,
    productFatPct: product?.productFatPct?.toString() ?? '',
    productProteinPct: product?.productProteinPct?.toString() ?? '',
    productPricePerTon: product?.productPricePerTon.toString() ?? '',
    productMinOrderTon: product?.productMinOrderTon.toString() ?? '1',
    stock: Object.fromEntries(
      (product?.stock ?? []).map((s) => [s.warehouseId, String(s.inventoryTon)]),
    ) as Record<string, string>,
  }));

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const num = (v: string) => (v.trim() === '' ? null : Number(v));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasDesc = LOCALES.some((l) => form.productDesc[l].trim());
    const input: ProductAdminInput = {
      productType: form.productType,
      productGrade: form.productGrade,
      productStatus: form.productStatus,
      productName: form.productName,
      productDesc: hasDesc ? form.productDesc : null,
      productFatPct: num(form.productFatPct),
      productProteinPct: num(form.productProteinPct),
      productPricePerTon: Number(form.productPricePerTon),
      productMinOrderTon: Number(form.productMinOrderTon),
      stock: (warehouses ?? []).map((w) => ({
        warehouseId: w.id,
        inventoryTon: Number(form.stock[w.id] ?? 0) || 0,
      })),
    };
    save.mutate({ id: product?.id, input }, { onSuccess: () => router.push('/admin/products') });
  };

  const field =
    'h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-heading outline-none focus:border-brand';
  const label = 'mb-1.5 block text-xs font-semibold text-muted';
  const error = apiErrorText(save.error, t);

  return (
    <>
      <AdminHeader
        title={product ? product.productName[locale] : t('products.new')}
        subtitle={product?.productSku ?? t('products.skuAuto')}
        actions={
          <Link href="/admin/products" className="text-sm font-semibold text-brand">
            ← {t('nav.products')}
          </Link>
        }
      />

      <form onSubmit={onSubmit} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <Card>
            <h2 className="mb-4 font-bold text-heading">{t('products.basic')}</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <label>
                <span className={label}>{t('products.type')}</span>
                <select
                  value={form.productType}
                  disabled={!!product} // the SKU encodes the type
                  onChange={(e) => set('productType', e.target.value as ProductType)}
                  className={field}
                >
                  {Object.values(ProductType).map((v) => (
                    <option key={v} value={v}>
                      {tp(`type.${v}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className={label}>{t('products.grade')}</span>
                <select
                  value={form.productGrade}
                  onChange={(e) => set('productGrade', e.target.value as ProductGrade)}
                  className={field}
                >
                  {Object.values(ProductGrade).map((v) => (
                    <option key={v} value={v}>
                      {tp(`grade.${v}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className={label}>{t('products.selling')}</span>
                <select
                  value={form.productStatus}
                  onChange={(e) => set('productStatus', e.target.value as ProductStatus)}
                  className={field}
                >
                  <option value="ACTIVE">{t('products.active')}</option>
                  <option value="PAUSED">{t('products.paused')}</option>
                </select>
              </label>
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 font-bold text-heading">{t('products.texts')}</h2>
            <div className="space-y-4">
              {LOCALES.map((l) => (
                <div key={l} className="grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
                  <span className="pt-2.5 text-sm font-semibold text-heading">{LANG_LABEL[l]}</span>
                  <div className="space-y-2">
                    <input
                      required
                      maxLength={120}
                      value={form.productName[l]}
                      onChange={(e) =>
                        set('productName', { ...form.productName, [l]: e.target.value })
                      }
                      placeholder={t('products.name')}
                      className={field}
                    />
                    <textarea
                      rows={2}
                      maxLength={2000}
                      value={form.productDesc[l]}
                      onChange={(e) =>
                        set('productDesc', { ...form.productDesc, [l]: e.target.value })
                      }
                      placeholder={t('products.desc')}
                      className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <h2 className="mb-4 font-bold text-heading">{t('products.priceAndSpec')}</h2>
            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2">
                <span className={label}>{t('products.price')} (₩/t)</span>
                <input
                  required
                  type="number"
                  min={1000}
                  step={1000}
                  value={form.productPricePerTon}
                  onChange={(e) => set('productPricePerTon', e.target.value)}
                  className={field}
                />
              </label>
              <label>
                <span className={label}>{tp('minOrder')} (t)</span>
                <input
                  required
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={form.productMinOrderTon}
                  onChange={(e) => set('productMinOrderTon', e.target.value)}
                  className={field}
                />
              </label>
              <span />
              <label>
                <span className={label}>{t('products.fat')} (%)</span>
                <input
                  type="number"
                  min={0}
                  max={99}
                  step={0.01}
                  value={form.productFatPct}
                  onChange={(e) => set('productFatPct', e.target.value)}
                  className={field}
                />
              </label>
              <label>
                <span className={label}>{t('products.protein')} (%)</span>
                <input
                  type="number"
                  min={0}
                  max={99}
                  step={0.01}
                  value={form.productProteinPct}
                  onChange={(e) => set('productProteinPct', e.target.value)}
                  className={field}
                />
              </label>
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 font-bold text-heading">{t('products.stockTitle')}</h2>
            <div className="space-y-3">
              {(warehouses ?? []).map((w) => (
                <label key={w.id} className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm text-heading">{w.warehouseName[locale]}</span>
                  <span className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={form.stock[w.id] ?? '0'}
                      onChange={(e) => set('stock', { ...form.stock, [w.id]: e.target.value })}
                      className={`${field} w-24 text-right`}
                    />
                    <span className="text-sm text-muted">t</span>
                  </span>
                </label>
              ))}
            </div>
          </Card>

          {isDemo && (
            <p className="rounded-2xl bg-white px-4 py-3 text-xs text-muted">
              🧪 {t('products.demoNote')}
            </p>
          )}
          {error && (
            <p role="alert" className="rounded-xl bg-[#fdecea] px-4 py-3 text-sm text-[#b42318]">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={save.isPending}
            className="h-12 w-full rounded-full bg-brand font-semibold text-white shadow-[0_12px_26px_rgba(32,101,174,0.3)] hover:bg-navy disabled:opacity-50"
          >
            {save.isPending ? t('saving') : t('save')}
          </button>
        </div>
      </form>
    </>
  );
}
