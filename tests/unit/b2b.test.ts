import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { BUSINESS_NAV } from "@/components/store/account-nav";
import { validateShop } from "@/components/store/b2b/shops-view";
import { isCustomerToken, isSubscriberToken } from "@/lib/auth/jwt";
import { SUBSCRIBER_PATHS, safeNext, zoneOf } from "@/lib/auth/zones";
import {
  addDays,
  cadenceLabel,
  dayLabel,
  dayLines,
  draftOf,
  hasErrors,
  itemsPayload,
  ledgerLabel,
  ledgerReduces,
  newLine,
  pickShop,
  todayIst,
  upcomingDates,
  validateLines,
  type Shop,
  type StandingItem,
} from "@/modules/store/b2b";
import { proxy } from "@/proxy";

const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
const tokenFor = (role: string) => `${b64({ alg: "HS256" })}.${b64({ sub: "1", role })}.sig`;

const item = (over: Partial<StandingItem> = {}): StandingItem => ({
  id: 1,
  product_id: 1,
  default_qty: 20000,
  frequency: "daily",
  interval_days: null,
  days_of_week: null,
  active: true,
  ...over,
});

describe("subscriber gating", () => {
  it("puts the business pages in their own zone; everything else in /account stays customer", () => {
    for (const p of [
      "/account/subscriptions",
      "/account/subscriptions/801",
      "/account/deliveries",
      "/account/invoices",
      "/account/shops",
    ])
      expect(zoneOf(p)).toBe("subscriber");
    expect(zoneOf("/account/orders")).toBe("customer");
    expect(zoneOf("/account/shopsy")).toBe("customer");
    // The subscription landing page is public marketing; managing one is under /account.
    expect(zoneOf("/subscriptions")).toBe("public");
    // A subscriber may be sent back to a business page after signing in.
    expect(safeNext("/account/deliveries", "customer", "/account")).toBe("/account/deliveries");
  });

  it("lists exactly the subscriber-gated pages in the business nav", () => {
    expect(BUSINESS_NAV.map((n) => n.href).sort()).toEqual([...SUBSCRIBER_PATHS].sort());
  });

  it("reads the subscriber role from the token (a subscriber is also a storefront customer)", () => {
    expect(isSubscriberToken(tokenFor("subscriber"))).toBe(true);
    expect(isCustomerToken(tokenFor("subscriber"))).toBe(true);
    expect(isSubscriberToken(tokenFor("customer"))).toBe(false);
    expect(isSubscriberToken(tokenFor("admin"))).toBe(false);
    expect(isSubscriberToken(undefined)).toBe(false);
  });

  it("admits subscribers, sends retail customers to /account and visitors to sign in", () => {
    const at = (path: string, role?: string) =>
      proxy(
        new NextRequest(`http://shop.test${path}`, {
          headers: role ? { cookie: `drs_at=${tokenFor(role)}` } : {},
        }),
      );
    expect(at("/account/subscriptions", "subscriber").headers.get("location")).toBeNull();
    expect(at("/account/deliveries", "customer").headers.get("location")).toBe("http://shop.test/account");
    expect(at("/account/invoices").headers.get("location")).toBe(
      "http://shop.test/account/login?next=%2Faccount%2Finvoices",
    );
    // Retail pages are unchanged for both roles.
    expect(at("/account/orders", "customer").headers.get("location")).toBeNull();
    expect(at("/account/orders", "subscriber").headers.get("location")).toBeNull();
  });
});

describe("standing orders", () => {
  it("describes cadences in words", () => {
    expect(cadenceLabel(item())).toBe("Every day");
    expect(cadenceLabel(item({ frequency: "alternate", interval_days: 2 }))).toBe("Every other day");
    expect(cadenceLabel(item({ frequency: "alternate", interval_days: 3 }))).toBe("Every 3 days");
    expect(cadenceLabel(item({ frequency: "weekly", days_of_week: "5,1,3" }))).toBe("Mon, Wed, Fri");
    expect(cadenceLabel(item({ frequency: "weekly", days_of_week: "1,2,3,4,5,6,7" }))).toBe("Every day");
  });

  it("round-trips lines into the PUT body with only the fields each cadence needs", () => {
    const weekly = draftOf(
      item({ product_id: 2, frequency: "weekly", days_of_week: "3,1", default_qty: 4000 }),
    );
    expect(weekly.days).toEqual([1, 3]);
    const alt = { ...newLine(3), qty: "2", frequency: "alternate" as const, interval: "3" };
    expect(itemsPayload([draftOf(item()), weekly, alt])).toEqual([
      { product_id: 1, default_qty: 20000, frequency: "daily", interval_days: null, days_of_week: null },
      { product_id: 2, default_qty: 4000, frequency: "weekly", interval_days: null, days_of_week: "1,3" },
      { product_id: 3, default_qty: 2, frequency: "alternate", interval_days: 3, days_of_week: null },
    ]);
  });

  it("validates quantities, intervals and weekdays like the backend", () => {
    const errs = validateLines([
      { ...newLine(1), qty: "" },
      { ...newLine(2), qty: "-1" },
      { ...newLine(3), qty: "5", frequency: "alternate", interval: "1" },
      { ...newLine(4), qty: "5", frequency: "weekly", days: [] },
      { ...newLine(5), qty: "0" },
    ]);
    expect(errs[0].qty).toBeTruthy();
    expect(errs[1].qty).toBeTruthy();
    expect(errs[2].interval).toBeTruthy();
    expect(errs[3].days).toBeTruthy();
    expect(errs[4]).toEqual({}); // a qty-0 line only delivers on days you add it
    expect(hasErrors(errs)).toBe(true);
    expect(hasErrors([{}, {}])).toBe(false);
  });

  it("merges a day's plan with the standing lines", () => {
    const items = [
      item(),
      item({ id: 2, product_id: 2, default_qty: 4000 }),
      item({ id: 3, product_id: 3, default_qty: 1 }),
      item({ id: 4, product_id: 4, active: false }),
    ];
    const lines = dayLines(items, {
      for_date: "2026-10-26",
      lines: [
        { product_id: 1, qty: 20000 },
        { product_id: 2, qty: 6000 },
      ],
    });
    expect(lines.map((l) => [l.item.product_id, l.qty, l.state])).toEqual([
      [1, 20000, "as-usual"],
      [2, 6000, "changed"],
      [3, 0, "none"],
    ]);
  });
});

describe("dates and labels", () => {
  const now = new Date("2026-10-25T20:00:00Z"); // 01:30 on the 26th in India

  it("counts days on the IST calendar", () => {
    expect(todayIst(now)).toBe("2026-10-26");
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(upcomingDates(3, now)).toEqual(["2026-10-27", "2026-10-28", "2026-10-29"]);
    expect(dayLabel("2026-10-26", now)).toBe("Today");
    expect(dayLabel("2026-10-27", now)).toBe("Tomorrow");
    expect(dayLabel("2026-10-29", now)).toMatch(/Thu,? 29 Oct/);
  });

  it("names statement lines and which way they move the balance", () => {
    expect(ledgerLabel("charge")).toBe("Delivery charge");
    expect(ledgerLabel("credit_note")).toBe("Credit note");
    expect(ledgerLabel("write_off")).toBe("Write off");
    expect(ledgerReduces("payment")).toBe(true);
    expect(ledgerReduces("charge")).toBe(false);
  });
});

describe("shops", () => {
  const shop = (id: number, status = "active"): Shop => ({ id, account_id: 1, name: `Shop ${id}`, status });

  it("keeps the remembered shop, else the first active one", () => {
    const shops = [shop(1, "inactive"), shop(2), shop(3)];
    expect(pickShop(shops, 3)?.id).toBe(3);
    expect(pickShop(shops, 99)?.id).toBe(2);
    expect(pickShop(shops, null)?.id).toBe(2);
    expect(pickShop([], 1)).toBeNull();
  });

  it("checks a new shop before sending it", () => {
    expect(validateShop({ name: "", address: "", state: "", pincode: "12" })).toEqual({
      name: expect.any(String),
      address: expect.any(String),
      state: expect.any(String),
      pincode: expect.any(String),
    });
    expect(
      validateShop({ name: "Sharma Sweets", address: "14 Ajmal Khan Rd", state: "Delhi", pincode: "110005" }),
    ).toEqual({});
  });
});
