/** Stock below this (tons, per warehouse) is "low" on the dashboard */
export const LOW_STOCK_TON = 10;

/** Dashboard revenue chart length */
export const DASHBOARD_DAYS = 14;

/** Copilot is an LLM call → per-admin limit */
export const COPILOT_RATE_LIMIT = { limit: 10, ttl: 60_000 };
