import type { components } from "@/lib/api/client";

/** B2B self-service (subscriber role): shops on standing orders, their deliveries and billing. */
export type Shop = components["schemas"]["ShopOut"];
export type Subscription = components["schemas"]["SubscriptionOut"];
export type SubscriptionDetail = components["schemas"]["SubscriptionDetail"];
export type StandingItem = components["schemas"]["ItemOut"];
export type StandingItemIn = components["schemas"]["ItemIn"];
export type Plan = components["schemas"]["PlanOut"];
export type DeliveryOrder = components["schemas"]["DeliveryOrderOut"];
export type Invoice = components["schemas"]["InvoiceOut"];
export type CreditLine = components["schemas"]["CreditLedgerLineOut"];

export type Frequency = "daily" | "alternate" | "weekly";

export const WEEKDAYS = [
  { n: 1, short: "Mon", long: "Monday" },
  { n: 2, short: "Tue", long: "Tuesday" },
  { n: 3, short: "Wed", long: "Wednesday" },
  { n: 4, short: "Thu", long: "Thursday" },
  { n: 5, short: "Fri", long: "Friday" },
  { n: 6, short: "Sat", long: "Saturday" },
  { n: 7, short: "Sun", long: "Sunday" },
] as const;

const parseDays = (csv: string | null | undefined): number[] =>
  [...new Set((csv ?? "").split(",").map(Number))].filter((n) => n >= 1 && n <= 7).sort((a, b) => a - b);

/** "Every day", "Every other day", "Every 3 days", "Mon, Wed, Fri". */
export function cadenceLabel(
  item: Pick<StandingItemIn, "frequency" | "interval_days" | "days_of_week">,
): string {
  if (item.frequency === "alternate") {
    const n = item.interval_days ?? 2;
    return n === 2 ? "Every other day" : n === 1 ? "Every day" : `Every ${n} days`;
  }
  if (item.frequency === "weekly") {
    const days = parseDays(item.days_of_week);
    if (days.length === 7) return "Every day";
    return days.length ? days.map((d) => WEEKDAYS[d - 1].short).join(", ") : "No days chosen";
  }
  return "Every day";
}

/** One editable line of a standing order (quantities in the product's own unit). */
export type LineDraft = {
  product_id: number;
  qty: string;
  frequency: Frequency;
  interval: string;
  days: number[];
};

export function draftOf(item: StandingItem): LineDraft {
  return {
    product_id: item.product_id,
    qty: String(item.default_qty),
    frequency: (["daily", "alternate", "weekly"].includes(item.frequency)
      ? item.frequency
      : "daily") as Frequency,
    interval: String(item.interval_days ?? 2),
    days: item.frequency === "weekly" ? parseDays(item.days_of_week) : [1, 2, 3, 4, 5, 6],
  };
}

export const newLine = (productId: number): LineDraft => ({
  product_id: productId,
  qty: "",
  frequency: "daily",
  interval: "2",
  days: [1, 2, 3, 4, 5, 6],
});

export type LineErrors = Partial<Record<"qty" | "interval" | "days", string>>;

/** Mirrors the backend's ItemIn checks so a save only fails for server-side reasons. */
export function validateLines(lines: readonly LineDraft[]): LineErrors[] {
  return lines.map((l) => {
    const e: LineErrors = {};
    const qty = Number(l.qty);
    if (l.qty.trim() === "" || !Number.isFinite(qty) || qty < 0) e.qty = "Enter a quantity (0 or more)";
    else if (qty > 100_000) e.qty = "That's more than we can deliver to one shop";
    if (l.frequency === "alternate") {
      const n = Number(l.interval);
      if (!Number.isInteger(n) || n < 2 || n > 30) e.interval = "Choose every 2 to 30 days";
    }
    if (l.frequency === "weekly" && !l.days.length) e.days = "Pick at least one day";
    return e;
  });
}

export const hasErrors = (errs: readonly LineErrors[]) => errs.some((e) => Object.keys(e).length > 0);

/** The PUT /subscriptions/{id}/items body (the full standing order; missing lines are dropped). */
export function itemsPayload(lines: readonly LineDraft[]): StandingItemIn[] {
  return lines.map((l) => ({
    product_id: l.product_id,
    default_qty: Number(l.qty),
    frequency: l.frequency,
    interval_days: l.frequency === "alternate" ? Number(l.interval) : null,
    days_of_week: l.frequency === "weekly" ? [...l.days].sort((a, b) => a - b).join(",") : null,
  }));
}

/** Calendar dates in India (deliveries and the cutoff run on IST). */
export function todayIst(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now);
}

export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

/** The next `count` delivery dates starting tomorrow (the first date changes can still reach). */
export function upcomingDates(count: number, now = new Date()): string[] {
  const today = todayIst(now);
  return Array.from({ length: count }, (_, i) => addDays(today, i + 1));
}

/** "Tomorrow", "Mon 27 Oct". */
export function dayLabel(iso: string, now = new Date()): string {
  const today = todayIst(now);
  if (iso === today) return "Today";
  if (iso === addDays(today, 1)) return "Tomorrow";
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

const SUB_STATUS: Record<string, string> = {
  active: "Active",
  paused: "Paused",
  cancelled: "Cancelled",
};
export const subscriptionStatusLabel = (s: string) => SUB_STATUS[s] ?? s.replace(/_/g, " ");

const LEDGER: Record<string, string> = {
  charge: "Delivery charge",
  payment: "Payment received",
  credit_note: "Credit note",
};
export const ledgerLabel = (t: string) =>
  LEDGER[t] ?? t.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

/**
 * What's owed now: the running balance after the most recent line. Picked by id/date rather
 * than trusting the API's newest-first order (a reorder upstream would show a stale figure).
 */
export function latestBalance(lines: readonly CreditLine[]): number {
  let latest = lines[0];
  for (const l of lines)
    if (l.created_at > latest.created_at || (l.created_at === latest.created_at && l.id > latest.id))
      latest = l;
  return latest.balance_after;
}

/** Payments and credit notes reduce what's owed. */
export const ledgerReduces = (t: string) => t === "payment" || t === "credit_note";

export const shopAddress = (s: Pick<Shop, "address" | "state" | "pincode">) =>
  [s.address, s.state, s.pincode].filter(Boolean).join(", ");

/** The shop switcher's choice, remembered per browser. */
export const SHOP_KEY = "drs.shop";

/** The remembered shop if it still belongs to the account, else the first active one. */
export function pickShop(shops: readonly Shop[], remembered: number | null): Shop | null {
  return (
    shops.find((s) => s.id === remembered) ?? shops.find((s) => s.status === "active") ?? shops[0] ?? null
  );
}

export type DayLine = { item: StandingItem; qty: number; state: "as-usual" | "changed" | "none" };

/**
 * One date's deliveries per standing line: the plan already merges the template with that
 * day's overrides (qty-0 lines are left out), so a missing line means nothing comes that day.
 */
export function dayLines(items: readonly StandingItem[], plan: Plan | null): DayLine[] {
  const qty = new Map((plan?.lines ?? []).map((l) => [l.product_id, l.qty]));
  return items
    .filter((i) => i.active)
    .map((item) => {
      const q = qty.get(item.product_id);
      if (q === undefined) return { item, qty: 0, state: "none" as const };
      return { item, qty: q, state: q === item.default_qty ? ("as-usual" as const) : ("changed" as const) };
    });
}
