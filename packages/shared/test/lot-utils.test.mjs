// Run: pnpm --filter @milcow/shared test  (Node's built-in test runner, no extra packages)
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import shared from '../dist/index.js';

const { bacteriaGrade, somaticGrade, surplusPrice, SURPLUS_MAX_PCT } = shared;
const H = 3_600_000;

describe('raw milk grades', () => {
  it('bacteria count → 1A below 30,000/mL, then 1B, 2, 3, 4', () => {
    assert.equal(bacteriaGrade(29_999), 'GRADE_1A');
    assert.equal(bacteriaGrade(30_000), 'GRADE_1B');
    assert.equal(bacteriaGrade(150_000), 'GRADE_2');
    assert.equal(bacteriaGrade(499_999), 'GRADE_3');
    assert.equal(bacteriaGrade(2_000_000), 'GRADE_4');
  });

  it('somatic cell count → grade 1 below 200,000/mL … grade 5 above 750,000', () => {
    assert.equal(somaticGrade(120_000), 'GRADE_1');
    assert.equal(somaticGrade(200_000), 'GRADE_2');
    assert.equal(somaticGrade(800_000), 'GRADE_5');
  });
});

describe('surplus dynamic price', () => {
  const milked = new Date('2026-11-13T05:00:00+09:00');
  const useBy = new Date(milked.getTime() + 72 * H);

  it('full price in the first 6 hours, next drop at +6 h', () => {
    const p = surplusPrice(1_200_000, milked, useBy, new Date(milked.getTime() + 2 * H));
    assert.equal(p.discountPct, 0);
    assert.equal(p.pricePerTon, 1_200_000);
    assert.equal(p.nextDropAt, new Date(milked.getTime() + 6 * H).toISOString());
  });

  it('−5 percentage points every 6 hours, rounded to 1,000 KRW', () => {
    const p = surplusPrice(1_234_567, milked, useBy, new Date(milked.getTime() + 13 * H));
    assert.equal(p.discountPct, 10);
    assert.equal(p.pricePerTon, 1_111_000);
  });

  it('never more than the maximum discount, and no next drop after the floor', () => {
    const p = surplusPrice(1_000_000, milked, useBy, new Date(milked.getTime() + 60 * H));
    assert.equal(p.discountPct, SURPLUS_MAX_PCT);
    assert.equal(p.nextDropAt, null);
  });

  it('expired after the use-by time', () => {
    const p = surplusPrice(1_000_000, milked, useBy, new Date(useBy.getTime() + 1));
    assert.equal(p.expired, true);
    assert.equal(p.hoursLeft, 0);
  });
});
