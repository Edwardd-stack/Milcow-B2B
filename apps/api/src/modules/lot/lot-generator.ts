import type { Prisma, PrismaClient } from '../../generated/prisma/client';
import { bacteriaGrade, somaticGrade } from '@milcow/shared';
import { between, seededRandom } from '../../libs/utils/random.util';
import {
  CO2E_FARM_KG_PER_KG,
  CO2E_TRANSPORT_KG_PER_TKM,
  FALLBACK_WAREHOUSE_CODE,
  LOT_PRODUCT_TYPES,
  LOT_USE_BY_HOURS,
  ROAD_FACTOR,
  SURPLUS_BASE_PRICE_RATE,
  SURPLUS_SHARE,
  TRUCK_SPEED_KMH,
} from './lot.constants';

type Db = PrismaClient | Prisma.TransactionClient;
const HOUR = 60 * 60 * 1000;

/**
 * Creates the demo milk lots of one Korean day (YYYY-MM-DD): 1–2 lots per farm that produces
 * raw milk or cream, delivered to the nearest warehouse (sometimes the second nearest).
 * Only lots that have ARRIVED at the warehouse by `now` are created, so it runs hourly and
 * each run adds the lots that arrived since the last one.
 * Deterministic (seeded by the date) + lot codes are unique → running it twice adds nothing.
 * Returns how many lots were created.
 */
export async function generateLotsForDay(db: Db, date: string, now = new Date()): Promise<number> {
  const [farms, warehouses, products] = await Promise.all([
    db.farm.findMany({ orderBy: { createdAt: 'asc' } }),
    db.warehouse.findMany({ orderBy: { createdAt: 'asc' } }),
    db.product.findMany({
      where: { productType: { in: [...LOT_PRODUCT_TYPES] }, productStatus: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
    }),
  ]);
  if (warehouses.length === 0) return 0;

  const rnd = seededRandom(`lots:${date}`);
  const compact = date.replaceAll('-', '');
  const seqByWarehouse = new Map<string, number>();
  const rows: Prisma.LotCreateManyInput[] = [];

  for (const farm of farms) {
    const own = products.filter((p) => p.farmId === farm.id);
    if (own.length === 0) continue; // this farm makes no fresh products

    const byDistance = [...warehouses].sort(
      (a, b) =>
        distanceKm(farm.farmLat, farm.farmLng, a.warehouseLat, a.warehouseLng) -
        distanceKm(farm.farmLat, farm.farmLng, b.warehouseLat, b.warehouseLng),
    );
    const lotsToday = rnd() < 0.55 ? 2 : 1;

    for (let n = 0; n < lotsToday; n++) {
      const product = own[Math.floor(rnd() * own.length)]!;
      // Mostly the nearest warehouse; about a third goes to the second nearest
      const warehouse = (rnd() < 0.35 && byDistance[1]) || byDistance[0]!;
      const km =
        distanceKm(farm.farmLat, farm.farmLng, warehouse.warehouseLat, warehouse.warehouseLng) *
        ROAD_FACTOR;
      const code = warehouse.warehouseCode ?? FALLBACK_WAREHOUSE_CODE;
      const seq = (seqByWarehouse.get(code) ?? 0) + 1;
      seqByWarehouse.set(code, seq);

      // Morning milking (04:30–06:30) or evening milking of the day before (17:00–18:30), Korea time
      const morning = n === 0 || rnd() < 0.5;
      const milkedAt = morning
        ? kst(date, 4.5 + rnd() * 2)
        : new Date(kst(date, 17 + rnd() * 1.5).getTime() - 24 * HOUR);
      const collectedAt = new Date(milkedAt.getTime() + between(rnd, 2, 4) * HOUR);
      const travelH = km / TRUCK_SPEED_KMH + 0.5;
      const arrivedAt = new Date(collectedAt.getTime() + travelH * HOUR);
      const useBy = new Date(milkedAt.getTime() + LOT_USE_BY_HOURS * HOUR);

      const volume = round(between(rnd, 8, 20), 1);
      const ageDays = (now.getTime() - milkedAt.getTime()) / (24 * HOUR);
      // Older lots have been partly sold already
      const sold = ageDays > 0.5 ? Math.min(1, between(rnd, 0.2, 0.8) * ageDays) : 0;
      const remaining = round(Math.max(0, volume * (1 - sold)), 1);

      // Lab values: most lots are top grade, a few are one step lower
      const bacteria = Math.round(
        rnd() < 0.85 ? between(rnd, 6_000, 28_000) : between(rnd, 31_000, 90_000),
      );
      const somatic = Math.round(
        rnd() < 0.8 ? between(rnd, 90_000, 195_000) : between(rnd, 205_000, 330_000),
      );
      const fat = round(
        product.productType === 'CREAM' ? between(rnd, 36, 40) : between(rnd, 3.6, 4.3),
        2,
      );
      const protein = round(
        product.productType === 'CREAM' ? between(rnd, 2.0, 2.4) : between(rnd, 3.0, 3.4),
        2,
      );

      const expired = now >= useBy;
      const isSurplus = product.productType === 'RAW_MILK' && rnd() < SURPLUS_SHARE;
      const co2e = volume * 1000 * CO2E_FARM_KG_PER_KG + volume * km * CO2E_TRANSPORT_KG_PER_TKM;

      // Still on its way → a later (hourly) run adds it. Checked AFTER all random draws,
      // so the sequence — and every lot code — is the same on every run.
      if (arrivedAt > now) continue;

      rows.push({
        lotCode: `ML-${compact}-${code}-${String(seq).padStart(2, '0')}`,
        lotStatus: expired ? 'EXPIRED' : remaining <= 0 ? 'SOLD_OUT' : 'IN_STOCK',
        lotMilkedAt: milkedAt,
        lotCollectedAt: collectedAt,
        lotArrivedAt: arrivedAt,
        lotUseBy: useBy,
        lotVolumeTon: volume,
        lotRemainingTon: remaining,
        lotBacteriaCount: bacteria,
        lotBacteriaGrade: bacteriaGrade(bacteria),
        lotSomaticCount: somatic,
        lotSomaticGrade: somaticGrade(somatic),
        lotFatPct: fat,
        lotProteinPct: protein,
        lotAntibiotic: 'NEGATIVE',
        lotTempLog: tempLog(rnd, milkedAt, collectedAt, arrivedAt, useBy, now),
        lotCo2eKg: round(co2e, 1),
        lotIsSurplus: isSurplus,
        lotBasePricePerTon:
          Math.round((product.productPricePerTon * SURPLUS_BASE_PRICE_RATE) / 1000) * 1000,
        productId: product.id,
        farmId: farm.id,
        warehouseId: warehouse.id,
      });
    }
  }

  const { count } = await db.lot.createMany({ data: rows, skipDuplicates: true });
  return count;
}

/** Lots whose processing deadline has passed → EXPIRED. Returns how many changed. */
export async function expireOldLots(db: Db, now = new Date()): Promise<number> {
  const { count } = await db.lot.updateMany({
    where: { lotStatus: 'IN_STOCK', lotUseBy: { lte: now } },
    data: { lotStatus: 'EXPIRED' },
  });
  return count;
}

// ── helpers ──

/** Cold-chain log: body temperature at milking → cooled to ≤4 °C → truck → warehouse (up to now) */
function tempLog(
  rnd: () => number,
  milked: Date,
  collected: Date,
  arrived: Date,
  useBy: Date,
  now: Date,
) {
  const points: { at: string; c: number; stage: string }[] = [];
  const add = (t: number, c: number, stage: string) => {
    if (t <= now.getTime()) points.push({ at: new Date(t).toISOString(), c: round(c, 1), stage });
  };
  const m = milked.getTime();
  add(m, between(rnd, 34.5, 36.5), 'MILKING');
  add(m + 0.5 * HOUR, between(rnd, 12, 18), 'FARM_TANK');
  add(m + 1.5 * HOUR, between(rnd, 3.0, 4.2), 'FARM_TANK');
  for (let t = m + 2.5 * HOUR; t < collected.getTime(); t += HOUR)
    add(t, between(rnd, 2.8, 4.0), 'FARM_TANK');
  for (let t = collected.getTime(); t < arrived.getTime(); t += 0.75 * HOUR)
    add(t, between(rnd, 2.6, 4.6), 'TRANSPORT');
  const end = Math.min(useBy.getTime(), now.getTime());
  for (let t = arrived.getTime(); t <= end; t += 4 * HOUR)
    add(t, between(rnd, 2.2, 3.8), 'WAREHOUSE');
  return points;
}

/** Great-circle distance (haversine), km */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

/** "YYYY-MM-DD" + hours (Korea time) → Date */
function kst(date: string, hours: number): Date {
  return new Date(new Date(`${date}T00:00:00.000+09:00`).getTime() + hours * HOUR);
}

function round(n: number, digits: number) {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}
