import type { LocalizedText, ProductGrade, ProductType } from '@milcow/shared';

export interface ProductSeed {
  key: string;
  type: ProductType;
  grade: ProductGrade;
  name: LocalizedText;
  desc: LocalizedText;
  fatPct: number;
  proteinPct: number;
  pricePerTon: number; // KRW — sample prices for the demo
  minOrderTon: number;
  farmKey: string | null;
  // tons in stock per warehouse key
  stock: Record<string, number>;
}

export const PRODUCTS: ProductSeed[] = [
  {
    key: 'raw-milk-premium',
    type: 'RAW_MILK',
    grade: 'PREMIUM',
    name: { ko: '프리미엄 원유 (1A등급)', en: 'Premium Raw Milk (Grade 1A)', uz: 'Premium xom sut (1A daraja)' },
    desc: {
      ko: '고원 방목 젖소의 원유. 체세포수 최상위 등급.',
      en: 'Raw milk from highland pasture-raised cows. Top somatic cell grade.',
      uz: "Yaylovda boqilgan sigirlarning xom suti. Somatik hujayralar bo'yicha eng yuqori daraja.",
    },
    fatPct: 4.1,
    proteinPct: 3.3,
    pricePerTon: 1_250_000,
    minOrderTon: 5,
    farmKey: 'pyeongchang',
    stock: { icheon: 80, pyeongtaek: 45, gimhae: 20 },
  },
  {
    key: 'raw-milk-standard',
    type: 'RAW_MILK',
    grade: 'GRADE_1',
    name: { ko: '원유 (1등급)', en: 'Raw Milk (Grade 1)', uz: 'Xom sut (1-daraja)' },
    desc: {
      ko: '유가공 공장용 표준 원유.',
      en: 'Standard raw milk for dairy processing plants.',
      uz: 'Sut qayta ishlash zavodlari uchun standart xom sut.',
    },
    fatPct: 3.8,
    proteinPct: 3.2,
    pricePerTon: 1_100_000,
    minOrderTon: 10,
    farmKey: 'anseong',
    stock: { icheon: 150, pyeongtaek: 120, gimhae: 90 },
  },
  {
    key: 'raw-milk-organic',
    type: 'RAW_MILK',
    grade: 'PREMIUM',
    name: { ko: '유기농 원유', en: 'Organic Raw Milk', uz: 'Organik xom sut' },
    desc: {
      ko: '유기농 인증 목장의 원유.',
      en: 'Raw milk from a certified organic farm.',
      uz: 'Sertifikatlangan organik fermaning xom suti.',
    },
    fatPct: 3.9,
    proteinPct: 3.3,
    pricePerTon: 1_450_000,
    minOrderTon: 3,
    farmKey: 'hoengseong',
    stock: { icheon: 25, pyeongtaek: 10, gimhae: 0 },
  },
  {
    key: 'fresh-cream',
    type: 'CREAM',
    grade: 'GRADE_1',
    name: { ko: '생크림 (유지방 38%)', en: 'Fresh Cream (38% fat)', uz: "Yangi qaymoq (38% yog')" },
    desc: {
      ko: '베이커리·카페용 동물성 생크림.',
      en: 'Dairy cream for bakeries and cafés.',
      uz: 'Novvoyxona va kafelar uchun tabiiy qaymoq.',
    },
    fatPct: 38,
    proteinPct: 2,
    pricePerTon: 6_500_000,
    minOrderTon: 1,
    farmKey: 'anseong',
    stock: { icheon: 12, pyeongtaek: 8, gimhae: 5 },
  },
  {
    key: 'unsalted-butter',
    type: 'BUTTER',
    grade: 'PREMIUM',
    name: { ko: '무염 버터', en: 'Unsalted Butter', uz: "Tuzsiz sariyog'" },
    desc: {
      ko: '제과·제빵용 무염 버터 (25kg 블록).',
      en: 'Unsalted butter for pastry and baking (25 kg blocks).',
      uz: "Qandolatchilik uchun tuzsiz sariyog' (25 kg bloklar).",
    },
    fatPct: 82,
    proteinPct: 0.8,
    pricePerTon: 12_000_000,
    minOrderTon: 0.5,
    farmKey: 'gochang',
    stock: { icheon: 6, pyeongtaek: 4, gimhae: 3 },
  },
  {
    key: 'mozzarella',
    type: 'CHEESE',
    grade: 'GRADE_1',
    name: { ko: '모짜렐라 치즈', en: 'Mozzarella Cheese', uz: "Motsarella pishlog'i" },
    desc: {
      ko: '피자·외식업체용 모짜렐라 (10kg 블록).',
      en: 'Mozzarella for pizza and food-service (10 kg blocks).',
      uz: 'Pitsa va ovqatlanish korxonalari uchun motsarella (10 kg bloklar).',
    },
    fatPct: 22,
    proteinPct: 24,
    pricePerTon: 9_500_000,
    minOrderTon: 0.5,
    farmKey: 'gochang',
    stock: { icheon: 9, pyeongtaek: 7, gimhae: 6 },
  },
  {
    key: 'plain-yogurt',
    type: 'YOGURT',
    grade: 'GRADE_1',
    name: { ko: '플레인 요거트 (벌크)', en: 'Plain Yogurt (bulk)', uz: 'Tabiiy yogurt (ulgurji)' },
    desc: {
      ko: '무가당 플레인 요거트, 20L 용기.',
      en: 'Unsweetened plain yogurt in 20 L containers.',
      uz: 'Shakarsiz tabiiy yogurt, 20 L idishlarda.',
    },
    fatPct: 3.2,
    proteinPct: 3.5,
    pricePerTon: 3_200_000,
    minOrderTon: 1,
    farmKey: 'paju',
    stock: { icheon: 15, pyeongtaek: 10, gimhae: 4 },
  },
  {
    key: 'skim-milk-powder',
    type: 'MILK_POWDER',
    grade: 'GRADE_1',
    name: { ko: '탈지분유', en: 'Skim Milk Powder', uz: "Yog'sizlantirilgan sut kukuni" },
    desc: {
      ko: '식품 가공용 탈지분유 (25kg 포대).',
      en: 'Skim milk powder for food processing (25 kg bags).',
      uz: "Oziq-ovqat sanoati uchun yog'sizlantirilgan sut kukuni (25 kg qoplar).",
    },
    fatPct: 1,
    proteinPct: 34,
    pricePerTon: 6_800_000,
    minOrderTon: 1,
    farmKey: null,
    stock: { icheon: 20, pyeongtaek: 30, gimhae: 10 },
  },
];
