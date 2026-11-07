/** UI locales (next-intl). DB stores the user's choice as `Lang` (KO / EN / UZ). */
export const LOCALES = ['ko', 'en', 'uz'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ko';

/** Text stored in 3 languages, e.g. productName: { ko: '원유', en: 'Raw milk', uz: 'Xom sut' } */
export type LocalizedText = Record<Locale, string>;

/** Query params for every list endpoint. */
export interface PaginationQuery {
  page?: number; // 1-based
  limit?: number;
}

/** Shape of every list response. */
export interface Paginated<T> {
  list: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Shape of every error response from the api. */
export interface ApiError {
  statusCode: number;
  message: string | string[]; // NestJS validation errors come as an array
  error?: string;
}
