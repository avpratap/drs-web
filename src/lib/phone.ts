/** Mirror of backend `normalize_phone` / `is_indian_mobile` for instant client-side feedback. */
export function normalizeIndianMobile(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  for (const prefix of ["00910", "0091", "0910", "091", "910", "91", "0"]) {
    if (digits.length === 10 + prefix.length && digits.startsWith(prefix)) return digits.slice(prefix.length);
  }
  return digits;
}

export function isIndianMobile(raw: string): boolean {
  return /^[6-9]\d{9}$/.test(normalizeIndianMobile(raw));
}
