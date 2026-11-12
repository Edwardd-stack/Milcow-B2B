/** Contact form limits (the same numbers are used by the web form) */
export const INQUIRY_NAME_MAX = 50;
export const INQUIRY_COMPANY_MAX = 100;
export const INQUIRY_MESSAGE_MAX = 2000;

/** Public form → spam guard: requests per IP */
export const INQUIRY_RATE_LIMIT = { limit: 3, ttl: 60_000 };
