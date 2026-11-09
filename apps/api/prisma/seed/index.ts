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
import { FARMS } from './data/farms';
import { MEMBERS } from './data/members';
import { PRODUCTS } from './data/products';
import { SERVICE_PLANS } from './data/service-plans';
import { WAREHOUSES } from './data/warehouses';

// Tables wiped before seeding (knowledge_chunks is NOT here — embeddings cost API calls)
const TABLES_TO_RESET = [
  'payments',
  'pickups',
  'pickup_slots',
  'order_items',
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

// Every test account logs in with this password (development only)
const SEED_PASSWORD = 'Milcow1234!';

const PICKUP_DAYS_AHEAD = 14;
const PICKUP_HOURS = [9, 10, 11, 13, 14, 15, 16]; // 12:00–13:00 is lunch
const PICKUP_TRUCKS_PER_SLOT = 3;

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
    await seedPickupSlots(prisma, warehouseIds);

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
    })),
  });
  console.log(`👤 Members: ${MEMBERS.length} (password: ${SEED_PASSWORD})`);
}

/** Pickup windows for the next 2 weeks, weekdays only, in Korea time (UTC+9). */
async function seedPickupSlots(prisma: PrismaClient, warehouseIds: Map<string, string>) {
  const slots: { warehouseId: string; slotStart: Date; slotEnd: Date; slotCapacity: number }[] = [];

  for (let day = 1; day <= PICKUP_DAYS_AHEAD; day++) {
    if (isWeekendInKorea(day)) continue;
    for (const hour of PICKUP_HOURS) {
      for (const warehouseId of warehouseIds.values()) {
        slots.push({
          warehouseId,
          slotStart: koreaTime(day, hour),
          slotEnd: koreaTime(day, hour + 1),
          slotCapacity: PICKUP_TRUCKS_PER_SLOT,
        });
      }
    }
  }

  await prisma.pickupSlot.createMany({ data: slots });
  console.log(`🚚 Pickup slots: ${slots.length}`);
}

// ── helpers ──

function requireId(ids: Map<string, string>, key: string): string {
  const id = ids.get(key);
  if (!id) throw new Error(`Seed data error: unknown key "${key}"`);
  return id;
}

/** Today's date in Korea + `dayOffset` days, at `hour`:00 Korea time, as a UTC Date. */
function koreaTime(dayOffset: number, hour: number): Date {
  const nowInKorea = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return new Date(
    Date.UTC(
      nowInKorea.getUTCFullYear(),
      nowInKorea.getUTCMonth(),
      nowInKorea.getUTCDate() + dayOffset,
      hour - 9, // Korea is UTC+9
    ),
  );
}

function isWeekendInKorea(dayOffset: number): boolean {
  const weekday = new Date(koreaTime(dayOffset, 12).getTime() + 9 * 60 * 60 * 1000).getUTCDay();
  return weekday === 0 || weekday === 6; // Sunday, Saturday
}

main().catch((error: unknown) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
