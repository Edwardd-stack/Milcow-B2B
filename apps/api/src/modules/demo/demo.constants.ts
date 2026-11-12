/** The account behind the "Try the demo" button (created by the seed) */
export const DEMO_BUYER_EMAIL = 'buyer@milcow.test';

/** Every night the demo buyer's orders and contracts are rebuilt (visitors may cancel things) */
export const DEMO_RESET_CRON = '0 4 * * *'; // 04:00 Korea time

/** Demo login is public → limit per IP */
export const DEMO_LOGIN_RATE_LIMIT = { limit: 10, ttl: 60_000 };

/** Delivery address used in demo orders (clearly not a real one) */
export const DEMO_ADDRESS = '경북 경산시 압량읍 (데모 공장)';
