'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import type { ProductDetail } from '@milcow/shared';
import { DoubleCheckIcon, FarmIcon } from '@/components/icons';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { useProduct } from '@/hooks/useProducts';
import { Link } from '@/i18n/navigation';
import { formatTon } from '@/lib/format';
import { GRADE_STYLE } from '../ProductCard';
import { ProductIllustration } from '../ProductIllustration';
import { DetailNav } from './DetailNav';
import { OrderPanel } from './OrderPanel';

// Content overlaps the hero by 64px; on ≥1600px screens the hero's bottom padding grows with the wave
// (see PageHero), so the overlap grows too — the content stays close to the title on big monitors.
const block = 'rounded-3xl bg-white shadow-[0_14px_40px_rgba(17,55,95,0.08)]';

/** /products/[id]: info blocks on the left, sticky order panel on the right */
export function ProductDetailView() {
  const t = useTranslations('ProductDetail');
  const tc = useTranslations('Catalog');
  const locale = useLocale() as 'ko' | 'en' | 'uz';
  const { id } = useParams<{ id: string }>();
  const { data: product, isPending, isError } = useProduct(id);
  const parent = { label: tc('title'), href: '/products' };

  // Browser tab title = the product's name (set here because the name is only known after loading;
  // a rendered <title> loses to the layout's metadata on client-side navigation)
  const name = product?.productName[locale];
  useEffect(() => {
    document.title = `${name ?? t('title')} | Milcow`;
  }, [name, t]);

  if (isError) {
    return (
      <>
        <PageHero title={t('title')} current={t('notFound')} parent={parent} />
        <Container>
          <div
            className={`${block} relative -mt-16 min-[100rem]:-mt-[calc(6.95vw-1rem)] mb-24 px-6 py-16 text-center`}
          >
            <p className="text-xl font-bold text-heading">{t('notFound')}</p>
            <p className="mt-2 text-muted">{t('notFoundText')}</p>
            <Link
              href="/products"
              className="mt-7 inline-block rounded-full bg-brand px-8 py-3.5 font-semibold text-white transition hover:bg-navy"
            >
              {t('back')}
            </Link>
          </div>
        </Container>
      </>
    );
  }

  return (
    <>
      <PageHero
        title={t('title')}
        current={product ? product.productName[locale] : '…'}
        parent={parent}
      />
      <Container>
        {isPending ? (
          <div className="relative -mt-16 min-[100rem]:-mt-[calc(6.95vw-1rem)] grid gap-6 pb-24 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-6">
              {[180, 110, 230, 110].map((h, i) => (
                <div key={i} className={`${block} animate-pulse`} style={{ height: h }} />
              ))}
            </div>
            <div className={`${block} h-[420px] animate-pulse`} />
          </div>
        ) : (
          // key → the chosen warehouse / quantity start fresh for every product
          <Loaded key={product.id} product={product} />
        )}
      </Container>
    </>
  );
}

function Loaded({ product }: { product: ProductDetail }) {
  const t = useTranslations('ProductDetail');
  const tp = useTranslations('Product');
  const locale = useLocale() as 'ko' | 'en' | 'uz';

  const min = product.productMinOrderTon;
  // Start with the warehouse that has the most stock
  const fullest = [...product.stock].sort((a, b) => b.inventoryTon - a.inventoryTon)[0];
  const [warehouseId, setWarehouseId] = useState(fullest?.warehouseId);
  const [ton, setTon] = useState(min);
  const warehouse = product.stock.find((s) => s.warehouseId === warehouseId);
  const maxStock = Math.max(1, ...product.stock.map((s) => s.inventoryTon));

  const specs = [
    { label: t('fat'), value: product.productFatPct !== null ? `${product.productFatPct}%` : '—' },
    {
      label: t('protein'),
      value: product.productProteinPct !== null ? `${product.productProteinPct}%` : '—',
    },
    { label: t('minOrder'), value: `${formatTon(min)} ${tp('ton')}` },
    { label: t('totalStock'), value: `${formatTon(product.totalStockTon)} ${tp('ton')}` },
  ];

  return (
    <div className="relative -mt-16 min-[100rem]:-mt-[calc(6.95vw-1rem)] grid gap-6 pb-24 lg:grid-cols-[minmax(0,1fr)_380px]">
      {/* Back + previous / next: one row across both columns */}
      <div className="lg:col-span-2">
        <DetailNav productId={product.id} />
      </div>

      <div className="min-w-0 space-y-6">
        {/* Product */}
        <section className={`${block} flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8`}>
          <ProductIllustration
            type={product.productType}
            className="h-32 w-32 shrink-0 sm:h-40 sm:w-40"
          />
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-semibold tracking-[0.15em] text-brand uppercase">
                {tp(`type.${product.productType}`)}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${GRADE_STYLE[product.productGrade]}`}
              >
                {tp(`grade.${product.productGrade}`)}
              </span>
            </p>
            <h2 className="mt-2 text-[clamp(1.5rem,3vw,2rem)] leading-tight font-extrabold text-heading">
              {product.productName[locale]}
            </h2>
            {product.productDesc && (
              <p className="mt-3 leading-relaxed text-muted">{product.productDesc[locale]}</p>
            )}
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink">
              {(['perkCold', 'perkPickup', 'perkContract'] as const).map((perk) => (
                <li key={perk} className="flex items-center gap-1.5">
                  <DoubleCheckIcon className="h-4 w-4 text-brand" />
                  {t(perk)}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Key numbers */}
        <dl className={`${block} grid grid-cols-2 gap-3 p-5 sm:grid-cols-4 sm:p-6`}>
          {specs.map((spec) => (
            <div key={spec.label} className="rounded-2xl bg-cream px-4 py-3.5">
              <dt className="text-xs text-muted">{spec.label}</dt>
              <dd className="mt-0.5 text-lg font-bold text-heading">{spec.value}</dd>
            </div>
          ))}
        </dl>

        {/* Stock per warehouse = the warehouse picker */}
        <section className={`${block} p-6 sm:p-8`}>
          <h3 className="text-lg font-bold text-heading">{t('stockTitle')}</h3>
          <p className="mt-1 mb-4 text-sm text-muted">{t('stockHint')}</p>
          <div role="radiogroup" aria-label={t('stockTitle')} className="space-y-2.5">
            {product.stock.map((s) => {
              const selected = s.warehouseId === warehouseId;
              const enough = s.inventoryTon >= min;
              return (
                <button
                  key={s.warehouseId}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={!enough}
                  onClick={() => {
                    setWarehouseId(s.warehouseId);
                    setTon((prev) => Math.min(Math.max(prev, min), s.inventoryTon));
                  }}
                  className={`flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border-2 px-4 py-3.5 text-left transition disabled:opacity-50 ${
                    selected ? 'border-brand bg-brand/[0.04]' : 'border-line hover:border-brand/40'
                  }`}
                >
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${selected ? 'border-brand' : 'border-line'}`}
                  >
                    {selected && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
                  </span>
                  <span className="min-w-0 flex-1 basis-40 truncate font-semibold text-heading">
                    {s.warehouseName[locale]}
                  </span>
                  <span className="h-2 min-w-24 flex-1 overflow-hidden rounded-full bg-line">
                    <span
                      className="block h-full rounded-full bg-brand"
                      style={{ width: `${(s.inventoryTon / maxStock) * 100}%` }}
                    />
                  </span>
                  <span className="w-20 text-right text-sm font-semibold text-heading">
                    {s.inventoryTon > 0
                      ? `${formatTon(s.inventoryTon)} ${tp('ton')}`
                      : t('soldOut')}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Origin farm */}
        <section className={`${block} flex flex-wrap items-center gap-5 p-6 sm:p-8`}>
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#e7f6ec] text-[#2f8f4e]">
            <FarmIcon className="h-8 w-8" />
          </span>
          <div className="min-w-0 flex-1 basis-48">
            <p className="text-xs text-muted">{t('originFarm')}</p>
            <p className="text-lg font-bold text-heading">
              {product.farm?.farmName[locale] ?? tp('noFarm')}
            </p>
            {product.farm && (
              <p className="truncate text-sm text-muted">{product.farm.farmAddress}</p>
            )}
          </div>
          <Link
            href="/map"
            className="rounded-full border border-brand px-6 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
          >
            {t('viewOnMap')}
          </Link>
        </section>
      </div>

      <OrderPanel product={product} warehouse={warehouse} ton={ton} onTon={setTon} />
    </div>
  );
}
