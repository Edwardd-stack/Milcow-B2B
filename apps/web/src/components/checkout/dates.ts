/** Local date → "YYYY-MM-DD" (toISOString would shift the day in UTC+9) */
export function toDateString(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The next `count` days we hand over goods: from tomorrow, Sundays skipped */
export function upcomingDays(count: number, from = new Date()): Date[] {
  const days: Date[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  while (days.length < count) {
    cursor.setDate(cursor.getDate() + 1);
    if (cursor.getDay() !== 0) days.push(new Date(cursor));
  }
  return days;
}
