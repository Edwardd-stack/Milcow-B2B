'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import type { DeliveryType, MemberInfo, ProductDetail } from '@milcow/shared';
import { clampTon } from '@/components/products/detail/OrderPanel';
import { ProductIllustration } from '@/components/products/ProductIllustration';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { useMe } from '@/hooks/useAuth';
import { useProduct } from '@/hooks/useProducts';
import { Link, useRouter } from '@/i18n/navigation';
import { formatKrw, formatTon } from '@/lib/format';
import { requestTossPayment, TOSS_CLIENT_KEY } from '@/lib/toss';
import { cancelOrder, createOrder, preparePayment } from '@/services/order.service';
import { toDateString, upcomingDays } from './dates';

const block = 'rounded-3xl bg-white shadow-[0_14px_40px_rgba(17,55,95,0.08)]';
const shell =
  'relative -mt-16 grid gap-6 pb-24 min-[100rem]:-mt-[calc(6.95vw-1rem)] lg:grid-cols-[minmax(0,1fr)_380px]';

type Stock = ProductDetail['stock'][number];
type Locale = 'ko' | 'en' | 'uz';

/** /checkout?product=…&warehouse=…&ton=… — one product, straight from its detail page */
export function CheckoutView() {
  const t = useTranslations('Checkout');
  const tc = useTranslations('Catalog');
  const params = useSearchParams();
  const router = useRouter();
  const productId = params.get('product') ?? '';
  const warehouseId = params.get('warehouse') ?? '';
  const tonParam = Number(params.get('ton'));

  const { data: member, isPending: meLoading } = useMe();
  const { data: product, isPending: productLoading, isError } = useProduct(productId);
  const parent = { label: tc('title'), href: '/products' };

  // Guests log in first and come straight back to this order
  useEffect(() => {
    if (!meLoading && !member) {
      const here = `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?next=${encodeURIComponent(here)}`);
    }
  }, [meLoading, member, router]);

  const warehouse = product?.stock.find((s) => s.warehouseId === warehouseId);
  const invalid =
    isError ||
    (product &&
      (!warehouse || !(tonParam > 0) || warehouse.inventoryTon < product.productMinOrderTon));

  return (
    <>
      <PageHero title={t('title')} current={t('title')} parent={parent} />
      <Container>
        {invalid ? (
          <div className={`${block} relative -mt-16 mb-24 px-6 py-16 text-center`}>
            <p className="text-xl font-bold text-heading">{t('invalid')}</p>
            <p className="mt-2 text-muted">{t('invalidText')}</p>
            <Link
              href="/products"
              className="mt-7 inline-block rounded-full bg-brand px-8 py-3.5 font-semibold text-white transition hover:bg-navy"
            >
              {t('toProducts')}
            </Link>
          </div>
        ) : productLoading || !member || !product || !warehouse ? (
          <div className={shell}>
            <div className="space-y-6">
              {[150, 150, 170].map((h, i) => (
                <div key={i} className={`${block} animate-pulse`} style={{ height: h }} />
              ))}
            </div>
            <div className={`${block} h-[420px] animate-pulse`} />
          </div>
        ) : (
          <Form
            product={product}
            warehouse={warehouse}
            ton={clampTon(tonParam, product.productMinOrderTon, warehouse.inventoryTon)}
            member={member}
          />
        )}
      </Container>
    </>
  );
}

function Form({
  product,
  warehouse,
  ton,
  member,
}: {
  product: ProductDetail;
  warehouse: Stock;
  ton: number;
  member: MemberInfo;
}) {
  const t = useTranslations('Checkout');
  const tp = useTranslations('Product');
  const locale = useLocale() as Locale;

  const [days] = useState(() => upcomingDays(7));
  const [delivery, setDelivery] = useState<DeliveryType>('PICKUP');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState(() => toDateString(days[0]!));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = Math.round(product.productPricePerTon * ton);
  const warehouseName = warehouse.warehouseName[locale];
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  const chosen = days.find((d) => toDateString(d) === date)!;
  const dateLabel = new Intl.DateTimeFormat(locale, {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).format(chosen);

  const pay = async () => {
    setError(null);
    if (member.memberType !== 'BUYER') return setError(t('buyerOnly'));
    if (delivery === 'DELIVERY' && !address.trim()) return setError(t('needAddress'));
    if (!TOSS_CLIENT_KEY) return setError(t('noKey'));

    setBusy(true);
    let orderId: string | null = null;
    try {
      // 1) order (stock is reserved)  2) payment record — the SERVER decides the amount
      const order = await createOrder({
        warehouseId: warehouse.warehouseId,
        orderDeliveryType: delivery,
        orderAddress: delivery === 'DELIVERY' ? address.trim() : undefined,
        orderScheduledDate: date,
        items: [{ productId: product.id, itemTon: ton }],
      });
      orderId = order.id;
      const payment = await preparePayment(order.id);

      // 3) Toss window → Toss redirects to successUrl / failUrl
      const base = `${window.location.origin}/${locale}/checkout`;
      await requestTossPayment(member.id, {
        amount: { currency: 'KRW', value: payment.amount },
        orderId: payment.tossOrderId,
        orderName: payment.orderName,
        customerEmail: payment.customerEmail,
        customerName: payment.customerName,
        successUrl: `${base}/success`,
        failUrl: `${base}/fail`,
      });
    } catch {
      // Window closed or something failed → don't keep the stock reserved
      if (orderId) await cancelOrder(orderId).catch(() => undefined);
      setError(t('error'));
      setBusy(false);
    }
  };

  const option = (type: DeliveryType, title: string, text: string, icon: React.ReactNode) => (
    <button
      type="button"
      role="radio"
      aria-checked={delivery === type}
      onClick={() => setDelivery(type)}
      className={`flex items-start gap-3.5 rounded-2xl border-2 p-4 text-left transition ${
        delivery === type ? 'border-brand bg-brand/[0.04]' : 'border-line hover:border-brand/40'
      }`}
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cream text-brand">
        {icon}
      </span>
      <span>
        <span className="block font-semibold text-heading">{title}</span>
        <span className="text-sm text-muted">{text}</span>
      </span>
    </button>
  );

  const rows = [
    { label: t('quantity'), value: `${formatTon(ton)} ${tp('ton')}` },
    { label: t('pricePerTon'), value: formatKrw(product.productPricePerTon, locale) },
    {
      label: t('receive'),
      value: `${delivery === 'PICKUP' ? t('pickup') : t('delivery')} · ${dateLabel}`,
    },
    { label: t('fee'), value: delivery === 'PICKUP' ? t('feeFree') : t('feeLater') },
  ];
  const info = [
    { label: t('company'), value: member.memberCompanyName },
    { label: t('contact'), value: member.memberNick },
    { label: t('email'), value: member.memberEmail },
    { label: t('phone'), value: member.memberPhone },
  ];

  return (
    <div className={shell}>
      <div className="min-w-0 space-y-6">
        <section className={`${block} p-6 sm:p-8`}>
          <Title step={1}>{t('step1')}</Title>
          <div role="radiogroup" aria-label={t('step1')} className="grid gap-3 sm:grid-cols-2">
            {option(
              'PICKUP',
              t('pickup'),
              t('pickupText', { warehouse: warehouseName }),
              <Icon d="M4 10 12 4l8 6v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1Z" />,
            )}
            {option(
              'DELIVERY',
              t('delivery'),
              t('deliveryText'),
              <Icon d="M3 7h11v9H3zM14 10h4l3 3v3h-7M7.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />,
            )}
          </div>
          {delivery === 'DELIVERY' && (
            <label className="mt-4 block">
              <span className="mb-2 block text-[13px] font-semibold text-heading">
                {t('address')}
              </span>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                maxLength={200}
                autoComplete="street-address"
                placeholder={t('addressPlaceholder')}
                className="h-[50px] w-full rounded-2xl border border-line px-4 text-[15px] outline-none transition placeholder:text-soft focus:border-brand focus:ring-4 focus:ring-brand/12"
              />
            </label>
          )}
        </section>

        <section className={`${block} p-6 sm:p-8`}>
          <Title step={2}>{t('step2')}</Title>
          <div
            role="radiogroup"
            aria-label={t('step2')}
            className="grid grid-cols-4 gap-2 sm:grid-cols-7"
          >
            {days.map((day) => {
              const value = toDateString(day);
              const on = value === date;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setDate(value)}
                  className={`rounded-2xl border py-2.5 text-center text-xs transition ${
                    on
                      ? 'border-brand bg-brand text-white shadow-[0_8px_18px_rgba(32,101,174,0.3)]'
                      : 'border-line text-muted hover:border-brand/40'
                  }`}
                >
                  {weekday.format(day)}
                  <b className={`block text-lg ${on ? '' : 'text-heading'}`}>{day.getDate()}</b>
                </button>
              );
            })}
          </div>
        </section>

        <section className={`${block} p-6 sm:p-8`}>
          <Title step={3}>{t('step3')}</Title>
          <dl className="grid gap-3 sm:grid-cols-2">
            {info.map((row) => (
              <div key={row.label} className="rounded-2xl bg-cream px-4 py-3">
                <dt className="text-xs text-muted">{row.label}</dt>
                <dd className="truncate font-semibold text-heading">{row.value || '—'}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <aside className={`${block} self-start p-6 sm:p-7 lg:sticky lg:top-6`}>
        <h2 className="mb-4 text-lg font-bold text-heading">{t('summary')}</h2>
        <div className="flex items-center gap-3.5 border-b border-line pb-4">
          <ProductIllustration type={product.productType} className="h-14 w-14 shrink-0" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-heading">{product.productName[locale]}</p>
            <p className="truncate text-xs text-muted">
              {tp(`type.${product.productType}`)} · {tp(`grade.${product.productGrade}`)} ·{' '}
              {warehouseName.replace(/^Milcow\s*/, '')}
            </p>
          </div>
        </div>
        <dl className="mt-3 space-y-2.5 text-sm">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between gap-4">
              <dt className="text-muted">{row.label}</dt>
              <dd className="text-right font-semibold text-heading">{row.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-dashed border-line pt-4">
          <span className="text-sm text-muted">
            {t('total')} <span className="text-xs text-soft">({t('vat')})</span>
          </span>
          <span className="text-[26px] font-extrabold text-heading">
            {formatKrw(total, locale)}
          </span>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-[#fdecea] px-4 py-3 text-sm text-[#b42318]">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={pay}
          disabled={busy}
          className="mt-5 h-[54px] w-full rounded-full bg-brand font-semibold text-white shadow-[0_12px_26px_rgba(32,101,174,0.3)] transition hover:bg-navy disabled:opacity-60"
        >
          {busy ? t('paying') : t('pay', { amount: formatKrw(total, locale) })}
        </button>
        <p className="mt-3 text-center text-xs text-muted">🔒 {t('secure')}</p>
        <Link
          href={`/products/${product.id}`}
          className="mt-3 block text-center text-sm font-medium text-brand hover:underline"
        >
          ← {t('back')}
        </Link>
      </aside>
    </div>
  );
}

function Title({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2.5 text-lg font-bold text-heading">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-[13px] text-white">
        {step}
      </span>
      {children}
    </h2>
  );
}

function Icon({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
