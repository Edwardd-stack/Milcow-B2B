import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canDemoModify,
  maskContact,
  maskEmail,
  maskPhone,
  refundDecision,
  validateCopilotCall,
} from '../dist/index.js';

test('demo policy: demo session may change only demo-owned records', () => {
  assert.equal(canDemoModify(false, false), true); // real admin → anything
  assert.equal(canDemoModify(true, true), true); // demo admin → demo buyer's order
  assert.equal(canDemoModify(true, false), false); // demo admin → real customer's order
});

test('maskEmail / maskPhone hide the private part', () => {
  assert.equal(maskEmail('buyer@company.co.kr'), 'bu***@c***.co.kr');
  assert.equal(maskEmail('a@b.com'), 'a***@b***.com');
  assert.equal(maskPhone('010-1234-5678'), '010-****-5678');
  assert.equal(maskPhone('12'), '****');
});

test('maskContact masks only real people in a demo session', () => {
  const real = { email: 'kim@real.kr', phone: '01012345678' };
  assert.deepEqual(maskContact(real, false, false), real);
  assert.deepEqual(maskContact(real, true, true), real);
  assert.deepEqual(maskContact(real, true, false), {
    email: 'ki***@r***.kr',
    phone: '010-****-5678',
  });
});

test('refundDecision: nothing / demo / toss', () => {
  assert.equal(refundDecision(null), 'none');
  assert.equal(refundDecision({ paymentStatus: 'READY', paymentKey: null }), 'none');
  assert.equal(refundDecision({ paymentStatus: 'DONE', paymentKey: 'demo_123' }), 'demo');
  assert.equal(refundDecision({ paymentStatus: 'DONE', paymentKey: 'tgen_abc' }), 'toss');
  assert.equal(refundDecision({ paymentStatus: 'CANCELED', paymentKey: 'tgen_abc' }), 'none');
});

test('copilot: unknown tools and bad arguments are rejected', () => {
  assert.equal(validateCopilotCall('dropTable', {}).ok, false);
  assert.equal(
    validateCopilotCall('salesSummary', { from: '2026-01-01', to: '2027-06-01' }).ok,
    false,
  );
  assert.equal(validateCopilotCall('salesSummary', { from: 'x', to: '2026-01-01' }).ok, false);
  assert.equal(
    validateCopilotCall('salesSummary', { from: '2026-11-01', to: '2026-11-30', groupBy: 'sql' })
      .ok,
    false,
  );
  assert.equal(
    validateCopilotCall('topCustomers', { from: '2026-11-01', to: '2026-11-30', limit: 99 }).ok,
    false,
  );
  assert.equal(validateCopilotCall('lowStock', { thresholdTon: -1 }).ok, false);
});

test('copilot: valid calls get defaults', () => {
  const r = validateCopilotCall('salesSummary', { from: '2026-11-01', to: '2026-11-30' });
  assert.deepEqual(r, {
    ok: true,
    call: {
      tool: 'salesSummary',
      params: { from: '2026-11-01', to: '2026-11-30', groupBy: 'product' },
    },
  });
  assert.deepEqual(validateCopilotCall('lowStock', {}), {
    ok: true,
    call: { tool: 'lowStock', params: { thresholdTon: 10 } },
  });
  assert.equal(validateCopilotCall('contractPipeline', undefined).ok, true);
});
