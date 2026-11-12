/**
 * Development seed: fills an empty database with demo data.
 * Run:  pnpm db:seed   (or: pnpm --filter @milcow/api db:seed)
 *
 * Re-runnable: it wipes the business tables first, so running it twice
 * gives the same result (the RAG knowledge base is left untouched).
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';
import { hashPassword } from '../../src/libs/utils/password.util';
import { buildDemoScenario } from '../../src/modules/demo/demo-scenario';
import { DEMO_BUYER_EMAIL } from '../../src/modules/demo/demo.constants';
import { generateLotsForDay } from '../../src/modules/lot/lot-generator';
import { ensurePickupSlots } from '../../src/modules/pickup/pickup-slots';
import { SKU_PREFIX, formatSku } from '../../src/modules/product/product-sku';
import { koreaToday } from '../../src/libs/utils/date.util';
import { FARMS } from './data/farms';
import { INQUIRIES } from './data/inquiries';
import { MEMBERS } from './data/members';
import { PRODUCTS } from './data/products';
import { SERVICE_PLANS } from './data/service-plans';
import { WAREHOUSES } from './data/warehouses';

// Tables wiped before seeding (knowledge_chunks is NOT here — embeddings cost API calls)
const TABLES_TO_RESET = [
  'payments',
  'order_events',
  'pickups',
  'pickup_slots',
  'order_items',
  'lots',
  'orders',
  'contract_services',
  'contracts',
  'service_plans',
  'inventories',
  'products',
  'farms',
  'members',
  'warehouses',
  'inquiries',
  'ai_logs',
];

// Every test account logs in with this password. Set SEED_PASSWORD when seeding a public (deployed)
// database — otherwise anyone who reads this file could log in as the admin.
const SEED_PASSWORD = process.env.SEED_PASSWORD || 'Milcow1234!';

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('The seed is for development only — refusing to wipe a production database.');
  }
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set (apps/api/.env)');

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    await resetTables(prisma);

    const warehouseIds = await seedWarehouses(prisma);
    const farmIds = await seedFarms(prisma);
    await seedProducts(prisma, farmIds, warehouseIds);
    await seedServicePlans(prisma);
    await seedMembers(prisma, warehouseIds);
    console.log(`🚚 Pickup slots: ${await ensurePickupSlots(prisma)}`);
    await seedLots(prisma);
    await seedDemoHistory(prisma);
    await seedInquiries(prisma);

    console.log('✅ Seed finished');
  } finally {
    await prisma.$disconnect();
  }
}

async function resetTables(prisma: PrismaClient) {
  // Table names are constants above (not user input), so building the SQL string is safe here
  const tableList = TABLES_TO_RESET.map((table) => `"${table}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} CASCADE`);
  console.log(`🧹 Reset ${TABLES_TO_RESET.length} tables`);
}

/** Returns a map: seed key → database id, so other tables can reference rows. */
async function seedWarehouses(prisma: PrismaClient) {
  const ids = new Map<string, string>();
  for (const w of WAREHOUSES) {
    const row = await prisma.warehouse.create({
      data: {
        warehouseName: w.name,
        warehouseCode: w.code,
        warehouseAddress: w.address,
        warehouseLat: w.lat,
        warehouseLng: w.lng,
        warehouseCapacityTon: w.capacityTon,
        warehouseTempC: w.tempC,
        warehouseOpenTime: w.openTime,
        warehouseCloseTime: w.closeTime,
      },
    });
    ids.set(w.key, row.id);
  }
  console.log(`🏭 Warehouses: ${ids.size}`);
  return ids;
}

async function seedFarms(prisma: PrismaClient) {
  const ids = new Map<string, string>();
  for (const f of FARMS) {
    const row = await prisma.farm.create({
      data: {
        farmName: f.name,
        farmDesc: f.desc,
        farmAddress: f.address,
        farmLat: f.lat,
        farmLng: f.lng,
        farmCowCount: f.cowCount,
        farmDailyCapacityTon: f.dailyCapacityTon,
        farmCertifications: f.certifications,
      },
    });
    ids.set(f.key, row.id);
  }
  console.log(`🐄 Farms: ${ids.size}`);
  return ids;
}

async function seedProducts(
  prisma: PrismaClient,
  farmIds: Map<string, string>,
  warehouseIds: Map<string, string>,
) {
  let stockRows = 0;
  const skuCount = new Map<string, number>();
  for (const p of PRODUCTS) {
    // Nested write: the product and its stock rows are created in one query
    await prisma.product.create({
      data: {
        productType: p.type,
        productGrade: p.grade,
        productName: p.name,
        productDesc: p.desc,
        productFatPct: p.fatPct,
        productProteinPct: p.proteinPct,
        productPricePerTon: p.pricePerTon,
        productMinOrderTon: p.minOrderTon,
        productSku: nextSeedSku(skuCount, p.type),
        farmId: p.farmKey ? requireId(farmIds, p.farmKey) : null,
        inventories: {
          create: Object.entries(p.stock).map(([warehouseKey, ton]) => ({
            warehouseId: requireId(warehouseIds, warehouseKey),
            inventoryTon: ton,
          })),
        },
      },
    });
    stockRows += Object.keys(p.stock).length;
  }
  console.log(`🥛 Products: ${PRODUCTS.length} (stock rows: ${stockRows})`);
}

async function seedServicePlans(prisma: PrismaClient) {
  await prisma.servicePlan.createMany({
    data: SERVICE_PLANS.map((s) => ({
      serviceType: s.type,
      serviceName: s.name,
      serviceDesc: s.desc,
      servicePrice: s.pricePerMonth,
    })),
  });
  console.log(`🧾 Service plans: ${SERVICE_PLANS.length}`);
}

async function seedMembers(prisma: PrismaClient, warehouseIds: Map<string, string>) {
  const passwordHash = await hashPassword(SEED_PASSWORD);
  await prisma.member.createMany({
    data: MEMBERS.map((m) => ({
      memberPassword: passwordHash,
      memberType: m.type,
      memberEmail: m.email,
      memberNick: m.nick,
      memberCompanyName: m.companyName,
      memberBizNo: m.bizNo,
      memberPhone: m.phone,
      memberLang: m.lang,
      warehouseId: m.warehouseKey ? requireId(warehouseIds, m.warehouseKey) : null,
      memberIsDemo: m.isDemo ?? false,
    })),
  });
  console.log(`👤 Members: ${MEMBERS.length} (password: ${SEED_PASSWORD})`);
}

/** Milk lots of the last 6 days (원유 품질 여권 + 잉여 원유) */
async function seedLots(prisma: PrismaClient) {
  const today = koreaToday();
  let total = 0;
  for (let d = 5; d >= 0; d--) {
    const day = new Date(new Date(`${today}T00:00:00Z`).getTime() - d * 86_400_000)
      .toISOString()
      .slice(0, 10);
    total += await generateLotsForDay(prisma, day);
  }
  console.log(`🧪 Milk lots: ${total}`);
}

/** Orders in every status, payments, pickups and contracts for the demo buyer */
async function seedDemoHistory(prisma: PrismaClient) {
  const buyer = await prisma.member.findUniqueOrThrow({ where: { memberEmail: DEMO_BUYER_EMAIL } });
  console.log(`📦 Demo orders: ${await buildDemoScenario(prisma, buyer.id)} (${DEMO_BUYER_EMAIL})`);
}

async function seedInquiries(prisma: PrismaClient) {
  await prisma.inquiry.createMany({ data: INQUIRIES });
  console.log(`✉️  Inquiries: ${INQUIRIES.length}`);
}

// ── helpers ──

/** MC-RAW-0001, MC-RAW-0002, … in seed order */
function nextSeedSku(counter: Map<string, number>, type: keyof typeof SKU_PREFIX): string {
  const n = (counter.get(type) ?? 0) + 1;
  counter.set(type, n);
  return formatSku(type, n);
}

function requireId(ids: Map<string, string>, key: string): string {
  const id = ids.get(key);
  if (!id) throw new Error(`Seed data error: unknown key "${key}"`);
  return id;
}

main().catch((error: unknown) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
