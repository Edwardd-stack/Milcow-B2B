'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@milcow/shared';
import { useAdminProducts, useProductStatus, useReindexKnowledge } from '@/hooks/useAdmin';
import { useRole } from '@/hooks/useRole';
import { Link } from '@/i18n/navigation';
import { formatKrw, formatTon } from '@/lib/format';
import { AdminHeader, apiErrorText } from './AdminShell';
import { LOW_STOCK_TON } from './admin-constants';

/** /admin/products — catalog incl. paused items, quick on/off switch, stock per warehouse */
export function ProductsAdmin() {
  const t = useTranslations('Admin');
  const tp = useTranslations('Product');
  const locale = useLocale() as Locale;
  const { isDemo } = useRole();
  const { data, isPending, isError } = useAdminProducts();
  const toggle = useProductStatus();
  const reindex = useReindexKnowledge();
  const error = apiErrorText(toggle.error ?? reindex.error, t);

  return (
    <>
      <AdminHeader
        title={t('nav.products')}
        subtitle={t('products.subtitle')}
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={reindex.isPending || isDemo}
              title={isDemo ? t('errors.demo') : t('products.reindexHint')}
              onClick={() => reindex.mutate()}
              className="rounded-full border border-brand/40 bg-white px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white disabled:opacity-50"
            >
              {reindex.isPending
                ? t('products.reindexing')
                : reindex.isSuccess
                  ? t('products.reindexed', { count: reindex.data.embedded })
                  : `🧠 ${t('products.reindex')}`}
            </button>
            <Link
              href="/admin/products/new"
              className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(32,101,174,0.28)] hover:bg-navy"
            >
              + {t('products.new')}
            </Link>
          </div>
        }
      />

      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-[#fdecea] px-4 py-3 text-sm text-[#b42318]">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-3xl bg-white shadow-[0_14px_40px_rgba(17,55,95,0.06)]">
        {isError ? (
          <p className="p-10 text-center text-muted">{t('errors.generic')}</p>
        ) : isPending ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-cream" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-cream/70 text-left text-xs text-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">SKU</th>
                  <th className="px-3 py-3 font-semibold">{t('products.name')}</th>
                  <th className="px-3 py-3 font-semibold">{t('products.type')}</th>
                  <th className="px-3 py-3 text-right font-semibold">{t('products.price')}</th>
                  <th className="px-3 py-3 text-right font-semibold">{tp('minOrder')}</th>
                  <th className="px-3 py-3 font-semibold">{t('products.stock')}</th>
                  <th className="px-5 py-3 font-semibold">{t('products.selling')}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((p) => {
                  const active = p.productStatus === 'ACTIVE';
                  return (
                    <tr key={p.id} className="border-t border-line hover:bg-cream/40">
                      <td className="px-5 py-3 font-mono text-xs text-muted">
                        {p.productSku ?? '—'}
                      </td>
                      <td className="px-3 py-3">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="font-semibold text-heading hover:text-brand"
                        >
                          {p.productName[locale]}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted">
                        {tp(`type.${p.productType}`)} · {tp(`grade.${p.productGrade}`)}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-heading">
                        {formatKrw(p.productPricePerTon, locale)}
                      </td>
                      <td className="px-3 py-3 text-right">{formatTon(p.productMinOrderTon)} t</td>
                      <td className="px-3 py-3">
                        <span className="flex flex-wrap gap-1">
                          {p.stock.map((s) => (
                            <span
                              key={s.warehouseId}
                              title={s.warehouseName[locale]}
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                s.inventoryTon < LOW_STOCK_TON
                                  ? 'bg-[#fff4e0] text-[#b86e00]'
                                  : 'bg-cream text-heading'
                              }`}
                            >
                              {s.warehouseName[locale].replace(/^Milcow\s*/, '').slice(0, 4)}{' '}
                              {formatTon(s.inventoryTon)}
                            </span>
                          ))}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={active}
                          aria-label={t('products.selling')}
                          disabled={toggle.isPending}
                          onClick={() =>
                            toggle.mutate({ id: p.id, status: active ? 'PAUSED' : 'ACTIVE' })
                          }
                          className={`relative h-6 w-11 rounded-full transition ${active ? 'bg-[#2f8f4e]' : 'bg-line'}`}
                        >
                          <span
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${active ? 'left-[22px]' : 'left-0.5'}`}
                          />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
