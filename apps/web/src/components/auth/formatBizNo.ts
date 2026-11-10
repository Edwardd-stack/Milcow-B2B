/** 1234567890 → 123-45-67890 while typing (사업자등록번호 format the API expects) */
export function formatBizNo(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 10);
  return [d.slice(0, 3), d.slice(3, 5), d.slice(5)].filter(Boolean).join('-');
}
