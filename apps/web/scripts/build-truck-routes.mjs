/**
 * Builds src/data/truck-routes.json — the road shapes the simulated trucks drive along on /map.
 *
 *   pnpm --filter @milcow/web routes:build              → real roads from Kakao Mobility Directions
 *   pnpm --filter @milcow/web routes:build --fallback   → smooth curves, no network needed
 *
 * The Kakao REST key is read from apps/api/.env (KAKAO_REST_API_KEY) and is never written anywhere.
 * If a request fails, that route falls back to a curve, so the file is always complete.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const { points, routes } = JSON.parse(readFileSync(resolve(here, '../src/data/fleet-points.json'), 'utf8'));
const OUT = resolve(here, '../src/data/truck-routes.json');
const MAX_POINTS = 150;
const ROAD_FACTOR = 1.3; // straight line → road km (fallback only)
const SPEED_KMH = 65; // average truck speed (fallback only)

const fallbackOnly = process.argv.includes('--fallback');
const key = fallbackOnly ? null : readKakaoKey();

const out = [];
for (const r of routes) {
  const a = points[r.from];
  const b = points[r.to];
  let result = null;
  if (key) {
    try {
      result = await kakaoRoute(key, a, b);
    } catch (error) {
      console.warn(`⚠️  ${r.id}: ${error.message} → curve`);
    }
  }
  result ??= curveRoute(a, b);
  out.push({ id: r.id, from: r.from, to: r.to, ...result });
  console.log(`${result.source === 'kakao' ? '🛣 ' : '〰️'} ${r.id}: ${result.km} km, ${result.minutes} min, ${result.path.length} pts`);
}

writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), routes: out }) + '\n');
console.log(`✅ ${out.length} routes → src/data/truck-routes.json`);

// ── Kakao Mobility ──

function readKakaoKey() {
  try {
    const env = readFileSync(resolve(here, '../../api/.env'), 'utf8');
    const match = env.match(/^KAKAO_REST_API_KEY=(.+)$/m);
    const value = match?.[1]?.trim().replace(/^["']|["']$/g, '');
    if (value) return value;
  } catch {
    /* no .env */
  }
  console.warn('⚠️  KAKAO_REST_API_KEY not found in apps/api/.env → curves only');
  return null;
}

async function kakaoRoute(key, a, b) {
  const url = new URL('https://apis-navi.kakaomobility.com/v1/directions');
  url.searchParams.set('origin', `${a.lng},${a.lat}`);
  url.searchParams.set('destination', `${b.lng},${b.lat}`);
  url.searchParams.set('priority', 'RECOMMEND');
  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${key}` } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route || route.result_code !== 0) throw new Error(route?.result_msg ?? 'no route');

  const path = [];
  for (const section of route.sections) {
    for (const road of section.roads) {
      for (let i = 0; i < road.vertexes.length; i += 2) path.push([road.vertexes[i + 1], road.vertexes[i]]);
    }
  }
  return {
    source: 'kakao',
    km: Math.round(route.summary.distance / 100) / 10,
    minutes: Math.round(route.summary.duration / 60),
    path: simplify(path, MAX_POINTS).map(([lat, lng]) => [round(lat), round(lng)]),
  };
}

// ── Fallback: a gentle curve (quadratic Bézier) between the two points ──

function curveRoute(a, b) {
  const dLat = b.lat - a.lat;
  const dLng = b.lng - a.lng;
  const bend = 0.18; // sideways offset of the control point, share of the distance
  const c = [(a.lat + b.lat) / 2 - dLng * bend, (a.lng + b.lng) / 2 + dLat * bend];
  const path = [];
  const n = 60;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const lat = (1 - t) ** 2 * a.lat + 2 * (1 - t) * t * c[0] + t ** 2 * b.lat;
    const lng = (1 - t) ** 2 * a.lng + 2 * (1 - t) * t * c[1] + t ** 2 * b.lng;
    path.push([round(lat), round(lng)]);
  }
  const km = Math.round(haversine(a.lat, a.lng, b.lat, b.lng) * ROAD_FACTOR * 10) / 10;
  return { source: 'curve', km, minutes: Math.round((km / SPEED_KMH) * 60 + 10), path };
}

// ── helpers ──

/** Douglas–Peucker: keep the shape, drop points until at most `max` remain */
function simplify(path, max) {
  if (path.length <= max) return path;
  let tolerance = 0.0001;
  let result = path;
  while (result.length > max) {
    result = douglasPeucker(path, tolerance);
    tolerance *= 1.6;
  }
  return result;
}

function douglasPeucker(pts, eps) {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  let maxD = 0;
  let index = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perpendicular(pts[i], a, b);
    if (d > maxD) [maxD, index] = [d, i];
  }
  if (maxD <= eps) return [a, b];
  const left = douglasPeucker(pts.slice(0, index + 1), eps);
  return [...left.slice(0, -1), ...douglasPeucker(pts.slice(index), eps)];
}

function perpendicular([y, x], [y1, x1], [y2, x2]) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1);
  return Math.abs(dy * x - dx * y + x2 * y1 - y2 * x1) / Math.hypot(dx, dy);
}

function haversine(lat1, lng1, lat2, lng2) {
  const r = (d) => (d * Math.PI) / 180;
  const h = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

function round(n) {
  return Math.round(n * 1e5) / 1e5;
}
