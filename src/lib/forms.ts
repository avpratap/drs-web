/**
 * Normalise react-hook-form values before sending them to the API:
 * blank strings → null for nullable fields, NaN (empty number inputs) → dropped,
 * and any keys not accepted by the endpoint are stripped.
 */
export function toPayload<T extends Record<string, unknown>>(
  values: Record<string, unknown>,
  allowed: readonly (keyof T & string)[],
  nullable: readonly (keyof T & string)[] = [],
): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const key of allowed) {
    if (!(key in values)) continue;
    let v = values[key];
    if (typeof v === "string") v = v.trim();
    if (typeof v === "number" && Number.isNaN(v)) v = undefined;
    if (v === "" || v === undefined) {
      if (nullable.includes(key)) out[key] = null;
      continue;
    }
    out[key] = v;
  }
  return out as Partial<T>;
}

export const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) return d;
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Where a price sits relative to `today` (YYYY-MM-DD, IST date). */
export function priceWindowState(
  validFrom: string,
  validTo: string | null | undefined,
  today: string,
): "scheduled" | "active" | "expired" {
  if (validFrom > today) return "scheduled";
  if (validTo && validTo < today) return "expired";
  return "active";
}

export function todayIST(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now);
}
