import type { components } from "@/lib/api/client";

export type Address = components["schemas"]["AddressOut"];

/** Canonical state/UT names the backend accepts for GST place of supply. */
export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export const PINCODE_RE = /^[1-9]\d{5}$/;
export const PHONE_RE = /^[6-9]\d{9}$/;

/** One-line address for the order (the backend stores it as text, with state + pincode apart). */
export function formatAddress(
  a: Pick<
    Address,
    "contact_name" | "contact_phone" | "line1" | "line2" | "landmark" | "city" | "state" | "pincode"
  >,
): string {
  return [
    a.contact_name,
    a.line1,
    a.line2,
    a.landmark && `Near ${a.landmark}`,
    `${a.city}, ${a.state} ${a.pincode}`,
    a.contact_phone && `Ph ${a.contact_phone}`,
  ]
    .filter(Boolean)
    .join(", ");
}

const dayFmt = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "short",
  timeZone: "Asia/Kolkata",
});

/** "Tomorrow, before 7 am" / "Thursday 30 Oct, before 7 am" from the courier ETA in days. */
export function deliveryLabel(etdDays: number | null | undefined, now = new Date()): string {
  const days = Math.max(1, etdDays ?? 1);
  if (days === 1) return "Tomorrow, before 7 am";
  return `${dayFmt.format(new Date(now.getTime() + days * 86_400_000))}, before 7 am`;
}

/**
 * Idempotency for checkout and payment: one key per ATTEMPT. A retry after a network error
 * or a 5xx re-sends the SAME key (so the server replays instead of placing a second order);
 * once the server has answered definitively (2xx/4xx), the next attempt gets a fresh key.
 */
export function keepKeyForRetry(status: number | null): boolean {
  return status === null || status >= 500 || status === 409;
}
