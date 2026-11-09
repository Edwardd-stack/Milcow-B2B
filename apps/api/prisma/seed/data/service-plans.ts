import type { LocalizedText, ServiceType } from '@milcow/shared';

export interface ServicePlanSeed {
  type: ServiceType;
  name: LocalizedText;
  desc: LocalizedText;
  pricePerMonth: number; // KRW
}

export const SERVICE_PLANS: ServicePlanSeed[] = [
  {
    type: 'COLD_CHAIN',
    name: { ko: '콜드체인 배송', en: 'Cold-Chain Delivery', uz: 'Sovuq zanjir yetkazib berish' },
    desc: {
      ko: '0–4°C 냉장 차량으로 문 앞까지 배송합니다.',
      en: 'Delivered to your door in 0–4 °C refrigerated trucks.',
      uz: "0–4 °C sovutgichli mashinalarda eshigingizgacha yetkazamiz.",
    },
    pricePerMonth: 300_000,
  },
  {
    type: 'QUALITY_TEST',
    name: { ko: '품질 검사 리포트', en: 'Quality Test Report', uz: 'Sifat tahlili hisoboti' },
    desc: {
      ko: '매 배송마다 유지방·단백질·체세포수 검사 결과를 제공합니다.',
      en: 'Fat, protein and somatic cell lab results with every delivery.',
      uz: "Har bir yetkazib berishda yog', oqsil va somatik hujayralar tahlili.",
    },
    pricePerMonth: 150_000,
  },
  {
    type: 'PRICE_LOCK',
    name: { ko: '가격 고정', en: 'Price Lock', uz: 'Narxni muzlatish' },
    desc: {
      ko: '계약 기간 동안 시장 가격이 올라도 톤당 가격을 고정합니다.',
      en: 'Your price per ton stays fixed for the whole contract, even if the market rises.',
      uz: "Bozor narxi oshsa ham, shartnoma davomida tonna narxi o'zgarmaydi.",
    },
    pricePerMonth: 200_000,
  },
  {
    type: 'PRIORITY_SUPPLY',
    name: { ko: '우선 공급', en: 'Priority Supply', uz: "Ustuvor ta'minot" },
    desc: {
      ko: '공급 부족 시 계약 고객에게 우선 배정합니다.',
      en: 'During shortages, your volume is reserved first.',
      uz: "Taqchillik paytida sizning hajmingiz birinchi navbatda ajratiladi.",
    },
    pricePerMonth: 250_000,
  },
  {
    type: 'FREE_PICKUP',
    name: { ko: '무료 픽업', en: 'Free Pickup', uz: 'Bepul olib ketish' },
    desc: {
      ko: '창고 픽업 슬롯을 우선 예약하고 상하차 비용이 무료입니다.',
      en: 'Priority pickup slots and free loading at our warehouses.',
      uz: "Omborlarda ustuvor olib ketish vaqtlari va bepul yuklash.",
    },
    pricePerMonth: 0,
  },
];
