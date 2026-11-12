/**
 * Live truck SIMULATION for /map (demo — not real GPS).
 *
 * Every truck gets a day schedule that depends only on the date (seeded random),
 * so everyone who opens the page at the same moment sees the same picture,
 * and a visit at another time shows the trucks somewhere else.
 * Trucks work 08:00–19:00 Korea time: load → drive → unload → drive back empty → repeat.
 */
import type { ProductType } from '@milcow/shared';
import fleetPoints from '@/data/fleet-points.json';
import truckRoutes from '@/data/truck-routes.json';

export type TruckKind = 'TANKER' | 'REEFER' | 'SMALL_REEFER';
export type TruckPhase = 'OFF' | 'LOADING' | 'DRIVING' | 'UNLOADING' | 'RETURNING' | 'IDLE';
export type PointKey = keyof typeof fleetPoints.points;
type LatLng = [number, number];

export interface TruckSpec {
  id: string;
  plate: string;
  kind: TruckKind;
  capacityTon: number;
  base: PointKey; // where it parks at night
  routeIds: string[]; // one of these is picked per day
  cargo: ProductType[]; // what it can carry
}

/** 6 trucks — fake plates in the real Korean format */
export const TRUCKS: TruckSpec[] = [
  {
    id: 'T-01',
    plate: '경기 80사 1204',
    kind: 'TANKER',
    capacityTon: 15,
    base: 'icheon',
    routeIds: ['pyeongchang-icheon', 'hoengseong-icheon'],
    cargo: ['RAW_MILK'],
  },
  {
    id: 'T-02',
    plate: '경기 80사 3317',
    kind: 'TANKER',
    capacityTon: 15,
    base: 'pyeongtaek',
    routeIds: ['anseong-pyeongtaek', 'gochang-pyeongtaek'],
    cargo: ['RAW_MILK'],
  },
  {
    id: 'T-03',
    plate: '경기 90바 5521',
    kind: 'REEFER',
    capacityTon: 11,
    base: 'icheon',
    routeIds: ['icheon-seoul', 'icheon-suwon'],
    cargo: ['CREAM', 'BUTTER', 'CHEESE'],
  },
  {
    id: 'T-04',
    plate: '경기 90바 6702',
    kind: 'REEFER',
    capacityTon: 11,
    base: 'icheon',
    routeIds: ['icheon-gyeongsan'],
    cargo: ['YOGURT'],
  },
  {
    id: 'T-05',
    plate: '경남 85아 2089',
    kind: 'SMALL_REEFER',
    capacityTon: 5,
    base: 'gimhae',
    routeIds: ['gimhae-busan', 'gimhae-daegu'],
    cargo: ['CHEESE', 'BUTTER', 'MILK_POWDER'],
  },
  {
    id: 'T-06',
    plate: '경기 85아 4410',
    kind: 'SMALL_REEFER',
    capacityTon: 5,
    base: 'pyeongtaek',
    routeIds: ['pyeongtaek-daejeon', 'pyeongtaek-suwon'],
    cargo: ['YOGURT', 'CREAM', 'MILK_POWDER'],
  },
];

/** The truck that carries the demo buyer's "on the way" (SHIPPING) order */
export const DEMO_DELIVERY_TRUCK = 'T-04';
const DELIVERY_TRUCKS = ['T-03', 'T-04', 'T-05', 'T-06'];

/** Delivery truck that "carries" a SHIPPING order (stable per order id) */
export function truckForOrder(orderId: string, isDemoBuyer: boolean): string {
  if (isDemoBuyer) return DEMO_DELIVERY_TRUCK;
  let h = 0;
  for (const ch of orderId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return DELIVERY_TRUCKS[h % DELIVERY_TRUCKS.length]!;
}

export const WORK_START_H = 8;
export const WORK_END_H = 19;
const MIN = 60_000;

interface Leg {
  phase: Exclude<TruckPhase, 'OFF' | 'IDLE'>;
  start: number; // epoch ms
  end: number;
  reverse: boolean; // driving back to the start of the route
}

export interface TruckDay {
  spec: TruckSpec;
  routeId: string;
  legs: Leg[];
  cargo: ProductType;
  cargoTon: number;
  tempBase: number;
  date: string;
}

export interface TruckState {
  id: string;
  plate: string;
  kind: TruckKind;
  capacityTon: number;
  phase: TruckPhase;
  position: LatLng;
  heading: number; // degrees, 0 = north
  from: PointKey; // current leg (or route) start
  to: PointKey;
  progress: number; // 0..1 of the current drive
  departAt: number | null; // current/next drive start
  etaAt: number | null; // current/next drive end
  remainingKm: number;
  cargo: ProductType | null;
  cargoTon: number;
  tempC: number;
  tripsDone: number;
  tripsTotal: number;
  routeId: string;
}

// ── routes ──

interface Route {
  id: string;
  from: PointKey;
  to: PointKey;
  km: number;
  minutes: number;
  path: LatLng[];
  cum: number[]; // cumulative km along the path
}

const ROUTES = new Map<string, Route>(
  truckRoutes.routes.map((r) => {
    const path = r.path as LatLng[];
    const cum = [0];
    for (let i = 1; i < path.length; i++) cum.push(cum[i - 1]! + km(path[i - 1]!, path[i]!));
    return [
      r.id,
      {
        id: r.id,
        from: r.from as PointKey,
        to: r.to as PointKey,
        km: r.km,
        minutes: r.minutes,
        path,
        cum,
      },
    ];
  }),
);

export const POINTS = fleetPoints.points;
export const routePath = (id: string): LatLng[] => ROUTES.get(id)?.path ?? [];

// ── schedule ──

/** All trucks' plans for one Korean day (YYYY-MM-DD) */
export function buildFleetDay(date: string): TruckDay[] {
  return TRUCKS.map((spec) => {
    const rnd = seeded(`${date}:${spec.id}`);
    const routeId = spec.routeIds[Math.floor(rnd() * spec.routeIds.length)]!;
    const route = ROUTES.get(routeId)!;
    const dayStart = kst(date, WORK_START_H);
    const dayEnd = kst(date, WORK_END_H);

    const legs: Leg[] = [];
    let t = dayStart + Math.round(rnd() * 80) * MIN; // first loading starts 08:00–09:20
    while (true) {
      const load = (25 + rnd() * 15) * MIN;
      const drive = route.minutes * (0.95 + rnd() * 0.15) * MIN;
      const unload = (20 + rnd() * 10) * MIN;
      const back = route.minutes * (0.9 + rnd() * 0.1) * MIN;
      if (t + load + drive + unload + back > dayEnd) break; // a whole round trip must fit the day
      legs.push({ phase: 'LOADING', start: t, end: (t += load), reverse: false });
      legs.push({ phase: 'DRIVING', start: t, end: (t += drive), reverse: false });
      legs.push({ phase: 'UNLOADING', start: t, end: (t += unload), reverse: false });
      legs.push({ phase: 'RETURNING', start: t, end: (t += back), reverse: true });
      t += (10 + rnd() * 25) * MIN; // short break at the base
    }

    const cargo = spec.cargo[Math.floor(rnd() * spec.cargo.length)]!;
    const cargoTon =
      spec.id === DEMO_DELIVERY_TRUCK
        ? 3
        : Math.round(spec.capacityTon * (0.55 + rnd() * 0.4) * 10) / 10;
    return { spec, routeId, legs, cargo, cargoTon, tempBase: 2.8 + rnd() * 1.0, date };
  });
}

/** Where a truck is and what it is doing at time `t` (epoch ms) */
export function truckStateAt(day: TruckDay, t: number): TruckState {
  const { spec, legs } = day;
  const route = ROUTES.get(day.routeId)!;
  const trips = legs.filter((l) => l.phase === 'DRIVING');
  const tripsDone = trips.filter((l) => l.end <= t).length;
  const base: TruckState = {
    id: spec.id,
    plate: spec.plate,
    kind: spec.kind,
    capacityTon: spec.capacityTon,
    phase: 'OFF',
    position: [POINTS[spec.base].lat, POINTS[spec.base].lng],
    heading: 0,
    from: route.from,
    to: route.to,
    progress: 0,
    departAt: trips.find((l) => l.start > t)?.start ?? null,
    etaAt: trips.find((l) => l.start > t)?.end ?? null,
    remainingKm: route.km,
    cargo: null,
    cargoTon: 0,
    // Gentle wobble around the base temperature (cold chain stays at 2–4.5 °C)
    tempC: Math.round((day.tempBase + Math.sin(t / 900_000 + spec.capacityTon) * 0.45) * 10) / 10,
    tripsDone,
    tripsTotal: trips.length,
    routeId: route.id,
  };

  const leg = legs.find((l) => l.start <= t && t < l.end);
  const first = legs[0];
  const last = legs.at(-1);
  if (!leg) {
    const working = first && last && t >= first.start && t < kst(day.date, WORK_END_H);
    // Between legs (short break) the truck waits at the route start (= its base side)
    const at = POINTS[route.from];
    return {
      ...base,
      phase: working ? 'IDLE' : 'OFF',
      position: working ? [at.lat, at.lng] : base.position,
    };
  }

  const loaded = leg.phase !== 'RETURNING';
  const withCargo = { cargo: loaded ? day.cargo : null, cargoTon: loaded ? day.cargoTon : 0 };
  const startPoint = POINTS[route.from];
  const endPoint = POINTS[route.to];

  if (leg.phase === 'LOADING') {
    const drive = legs[legs.indexOf(leg) + 1]!;
    return {
      ...base,
      ...withCargo,
      phase: 'LOADING',
      position: [startPoint.lat, startPoint.lng],
      departAt: drive.start,
      etaAt: drive.end,
    };
  }
  if (leg.phase === 'UNLOADING') {
    return {
      ...base,
      ...withCargo,
      phase: 'UNLOADING',
      position: [endPoint.lat, endPoint.lng],
      progress: 1,
      remainingKm: 0,
      departAt: null,
      etaAt: null,
    };
  }

  // Driving (there or back)
  const progress = Math.min(1, (t - leg.start) / (leg.end - leg.start));
  const along = leg.reverse ? 1 - progress : progress;
  const { position, heading } = pointAlong(route, along, leg.reverse);
  return {
    ...base,
    ...withCargo,
    phase: leg.phase,
    position,
    heading,
    from: leg.reverse ? route.to : route.from,
    to: leg.reverse ? route.from : route.to,
    progress,
    departAt: leg.start,
    etaAt: leg.end,
    remainingKm: Math.round(route.km * (1 - progress) * 10) / 10,
  };
}

/** Korea date of an epoch time, "YYYY-MM-DD" */
export function koreaDate(t: number): string {
  return new Date(t + 9 * 3_600_000).toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" + hour (Korea) → epoch ms */
export function kst(date: string, hour: number): number {
  return new Date(`${date}T00:00:00.000+09:00`).getTime() + hour * 3_600_000;
}

// ── geometry ──

function pointAlong(
  route: Route,
  share: number,
  reverse: boolean,
): { position: LatLng; heading: number } {
  const target = route.cum.at(-1)! * share;
  let i = route.cum.findIndex((c) => c >= target);
  if (i <= 0) i = 1;
  const a = route.path[i - 1]!;
  const b = route.path[i]!;
  const seg = route.cum[i]! - route.cum[i - 1]! || 1;
  const k = (target - route.cum[i - 1]!) / seg;
  const position: LatLng = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  const [from, to] = reverse ? [b, a] : [a, b];
  const heading = (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI;
  return { position, heading };
}

function km([lat1, lng1]: LatLng, [lat2, lng2]: LatLng): number {
  const r = (d: number) => (d * Math.PI) / 180;
  const h =
    Math.sin(r(lat2 - lat1) / 2) ** 2 +
    Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** Seeded random (FNV-1a → mulberry32): same seed, same numbers */
function seeded(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
