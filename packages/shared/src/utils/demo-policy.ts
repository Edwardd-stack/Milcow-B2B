/**
 * Rules for the "Try the demo" accounts (demo buyer / admin / staff).
 * Pure functions — the API uses them, the tests check them.
 */

/** E-mail domains used only by seed / demo data (".test" can never be a real mailbox) */
export const DEMO_EMAIL_SUFFIX = '.test';

export function isDemoEmail(email: string): boolean {
  return email.toLowerCase().endsWith(DEMO_EMAIL_SUFFIX);
}

/**
 * May this session change a record?
 *  - a normal session (real admin / staff / buyer): yes — the role checks decide the rest
 *  - a demo session: only records owned by demo accounts (seed data that is rebuilt every night)
 */
export function canDemoModify(sessionIsDemo: boolean, ownerIsDemo: boolean): boolean {
  return !sessionIsDemo || ownerIsDemo;
}

/** "buyer@company.co.kr" → "bu***@c***.co.kr" (demo sessions never see real contact data) */
export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at < 1) return '***';
  const name = email.slice(0, at);
  const domain = email.slice(at + 1);
  const dot = domain.indexOf('.');
  const host = dot > 0 ? domain.slice(0, dot) : domain;
  const rest = dot > 0 ? domain.slice(dot) : '';
  return `${name.slice(0, Math.min(2, name.length - 1) || 1)}***@${host.slice(0, 1)}***${rest}`;
}

/** "010-1234-5678" → "010-****-5678" (keeps the first and last group) */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return '****';
  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
}

/** Contact data as a demo session may see it: demo accounts as-is, everyone else masked */
export function maskContact<T extends { email: string; phone: string | null }>(
  contact: T,
  sessionIsDemo: boolean,
  ownerIsDemo: boolean,
): T {
  if (!sessionIsDemo || ownerIsDemo) return contact;
  return {
    ...contact,
    email: maskEmail(contact.email),
    phone: contact.phone ? maskPhone(contact.phone) : null,
  };
}

/** Prefix of payment keys created by the demo scenario (no real money behind them) */
export const DEMO_PAYMENT_KEY_PREFIX = 'demo_';

export type RefundDecision = 'none' | 'demo' | 'toss';

/**
 * What happens to the money when an order is cancelled:
 *  - 'none'  → nothing was paid
 *  - 'demo'  → a demo payment: just mark it cancelled, never call Toss
 *  - 'toss'  → a real (test-mode) payment: ask Toss to refund it
 */
export function refundDecision(
  payment: { paymentStatus: string; paymentKey: string | null } | null | undefined,
): RefundDecision {
  if (!payment || payment.paymentStatus !== 'DONE' || !payment.paymentKey) return 'none';
  return payment.paymentKey.startsWith(DEMO_PAYMENT_KEY_PREFIX) ? 'demo' : 'toss';
}
