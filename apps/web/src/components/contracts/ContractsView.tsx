'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import type { ContractDraftResponse, Locale } from '@milcow/shared';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { useMe } from '@/hooks/useAuth';
import { useContractDraft, useCreateContract, useServicePlans } from '@/hooks/useContracts';
import { useWarehouses } from '@/hooks/useLocations';
import { useProducts } from '@/hooks/useProducts';
import { useRouter } from '@/i18n/navigation';
import { ApiRequestError } from '@/lib/api-client';
import { AiAssistant } from './AiAssistant';
import { ContractList } from './ContractList';
import { ContractPaper } from './ContractPaper';
import {
  firstOfNextMonth,
  MAX_MONTHS,
  monthlyDates,
  type EditableContract,
} from './contract-utils';

const EMPTY: EditableContract = {
  productId: '',
  warehouseId: '',
  start: '',
  months: 6,
  ton: 0,
  deliveryType: 'PICKUP',
  address: '',
  serviceIds: [],
};

function errorKey(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 429) return 'rateLimit';
    if (error.status === 403) return 'buyerOnly';
    if (error.status === 400 || error.status === 409) return 'invalid';
  }
  return 'busy';
}

/** AI draft (from the API) → the editable shape of the paper */
function fromDraft(res: ContractDraftResponse, current: EditableContract): EditableContract {
  const d = res.draft;
  const months =
    d.contractStart && d.contractEnd
      ? monthlyDates(d.contractStart, MAX_MONTHS).filter((date) => date <= d.contractEnd!).length
      : current.months;
  return {
    productId: d.productId ?? '',
    warehouseId: d.warehouseId ?? '',
    start: d.contractStart ?? '',
    months,
    ton: d.contractMonthlyTon ?? 0,
    deliveryType: d.contractDeliveryType ?? 'PICKUP',
    address: d.contractAddress ?? '',
    serviceIds: d.servicePlanIds,
  };
}

/** /contracts — left: describe it to the AI, right: the contract paper, below: my contracts */
export function ContractsView() {
  const t = useTranslations('Contracts');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const params = useSearchParams();

  const { data: member, isPending: meLoading } = useMe();
  const { data: productPage } = useProducts({ limit: 50 });
  const { data: warehouses = [] } = useWarehouses();
  const { data: plans = [] } = useServicePlans();
  const products = productPage?.list ?? [];

  const aiDraft = useContractDraft();
  const save = useCreateContract();

  const [text, setText] = useState('');
  const [paper, setPaper] = useState<EditableContract>(EMPTY);
  const [editing, setEditing] = useState(false);
  const [result, setResult] = useState<ContractDraftResponse | null>(null);
  const [saved, setSaved] = useState<'submitted' | 'draft' | null>(null);

  // Guests log in first and come back here
  useEffect(() => {
    if (!meLoading && !member) {
      const here = `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?next=${encodeURIComponent(here)}`);
    }
  }, [meLoading, member, router]);

  // From a product page (?product=…): start the paper and the prompt with that product, once
  const fromProduct = products.find((p) => p.id === params.get('product'));
  const [prefilled, setPrefilled] = useState(false);
  if (fromProduct && !prefilled) {
    // setState during render (not in an effect) = React's pattern for "derive once from data"
    setPrefilled(true);
    setPaper({
      ...EMPTY,
      productId: fromProduct.id,
      ton: fromProduct.productMinOrderTon,
      start: firstOfNextMonth(),
    });
    setText(
      t('ai.prefill', {
        product: fromProduct.productName[locale],
        ton: fromProduct.productMinOrderTon,
      }),
    );
  }

  const askAi = () => {
    if (!text.trim() || aiDraft.isPending) return;
    setSaved(null);
    aiDraft.mutate(
      { request: text.trim(), locale },
      {
        onSuccess: (res) => {
          setResult(res);
          setPaper((current) => fromDraft(res, current));
          setEditing(res.missing.length > 0); // something is missing → open the fields at once
        },
      },
    );
  };

  const onSave = (submit: boolean) => {
    save.mutate(
      {
        submit,
        input: {
          productId: paper.productId,
          warehouseId: paper.warehouseId,
          contractStart: paper.start,
          contractEnd: monthlyDates(paper.start, paper.months).at(-1)!,
          contractMonthlyTon: paper.ton,
          contractDeliveryType: paper.deliveryType,
          contractAddress: paper.deliveryType === 'DELIVERY' ? paper.address.trim() : undefined,
          servicePlanIds: paper.serviceIds,
        },
      },
      {
        onSuccess: () => {
          setSaved(submit ? 'submitted' : 'draft');
          setPaper(EMPTY);
          setResult(null);
          setText('');
          setEditing(false);
          document
            .getElementById('my-contracts')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },
      },
    );
  };

  return (
    <>
      <PageHero title={t('title')} current={t('title')} />
      <Container>
        {!member ? (
          <div className="relative -mt-16 mb-24 grid gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
            <div className="h-[460px] animate-pulse rounded-3xl bg-white" />
            <div className="h-[560px] animate-pulse rounded-3xl bg-white" />
          </div>
        ) : (
          <div className="relative -mt-16 pb-18 min-[100rem]:-mt-[calc(6.95vw-1rem)]">
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
              <AiAssistant
                text={text}
                onText={setText}
                onSubmit={askAi}
                pending={aiDraft.isPending}
                error={aiDraft.isError ? t(`errors.${errorKey(aiDraft.error)}`) : null}
                result={result}
              />
              <div className="lg:sticky lg:top-6">
                <ContractPaper
                  value={paper}
                  onChange={(patch) => setPaper((current) => ({ ...current, ...patch }))}
                  editing={editing}
                  onEdit={setEditing}
                  products={products}
                  warehouses={warehouses}
                  plans={plans}
                  onSave={onSave}
                  saving={save.isPending}
                  error={save.isError ? t(`errors.${errorKey(save.error)}`) : null}
                />
              </div>
            </div>

            <div id="my-contracts" className="scroll-mt-6">
              {saved && (
                <p
                  role="status"
                  className="mt-10 rounded-2xl bg-[#e7f6ec] px-5 py-4 font-medium text-[#2f8f4e]"
                >
                  ✓ {t(`saved.${saved}`)}
                </p>
              )}
              <ContractList />
            </div>
          </div>
        )}
      </Container>
    </>
  );
}
