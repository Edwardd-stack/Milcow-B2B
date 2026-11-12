/** "1,250,000원" (ko) / "₩1,250,000" (en, uz) */
export function formatKrw(value: number, locale: string): string {
  const number = value.toLocaleString('en-US');
  return locale === 'ko' ? `${number}원` : `₩${number}`;
}

/** 0.5 → "0.5", 10 → "10" (no trailing zeros) */
export function formatTon(value: number): string {
  return Number(value.toFixed(2)).toString();
}
