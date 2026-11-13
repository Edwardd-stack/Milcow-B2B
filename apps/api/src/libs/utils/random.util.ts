/**
 * Seeded random numbers: the same seed always gives the same sequence.
 * Used for demo data (lots, lab values) so a day's data is stable and re-runs don't duplicate it.
 */
export function seededRandom(seed: string): () => number {
  // string → 32-bit seed (FNV-1a), then mulberry32
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random number in [min, max) from a generator */
export const between = (rnd: () => number, min: number, max: number) => min + rnd() * (max - min);
