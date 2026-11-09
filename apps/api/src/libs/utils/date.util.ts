/** Date-only helpers. Dates travel as "YYYY-MM-DD" strings; @db.Date columns hold UTC midnight. */

const pad = (n: number) => String(n).padStart(2, '0');

/** Today's date in Korea, e.g. "2026-11-09" */
export function koreaToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
}

/** Date from a @db.Date column → "YYYY-MM-DD" */
export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" → Date at UTC midnight (what a @db.Date column stores) */
export function fromDateString(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/**
 * Monthly delivery dates of a contract: the same day-of-month as the start date,
 * clamped to short months (31 Jan → 28/29 Feb), up to and including the end date.
 */
export function monthlyDates(start: string, end: string, maxMonths = 120): string[] {
  const [year = 0, month = 1, day = 1] = start.split('-').map(Number);
  const dates: string[] = [];

  for (let i = 0; i < maxMonths; i++) {
    const y = year + Math.floor((month - 1 + i) / 12);
    const m = ((month - 1 + i) % 12) + 1;
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const date = `${y}-${pad(m)}-${pad(Math.min(day, daysInMonth))}`;
    if (date > end) break;
    dates.push(date);
  }
  return dates;
}
