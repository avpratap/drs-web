import { describe, expect, it } from "vitest";
import { compactINR, niceTicks } from "@/components/charts/scale";
import { buildPayload, rulesFor, type FieldDef } from "@/components/resource/fields";
import { statusTone } from "@/components/ui/badge";
import { TOTAL_HEADER, toLimitOffset, totalFrom } from "@/lib/api/pagination";
import { filterBool, filterNumber, filterValue, idem, requireMeta } from "@/lib/api/resource";
import { decodeJwt, isAdminToken } from "@/lib/auth/jwt";
import { humanize, money } from "@/lib/format";
import { priceWindowState, toPayload } from "@/lib/forms";
import { listHref } from "@/lib/list-href";
import { isIndianMobile, normalizeIndianMobile } from "@/lib/phone";
import { daysUntil, isLow } from "@/modules/inventory/stock";
import { fillDays } from "@/modules/reports/series";
import { tagsToApi } from "@/modules/content/fields";

const b64url = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (claims: object) => `${b64url({ alg: "HS256" })}.${b64url(claims)}.sig`;

describe("pagination", () => {
  it("maps Refine pages to limit/offset (capped at the API max)", () => {
    expect(toLimitOffset({ currentPage: 3, pageSize: 20 })).toMatchObject({ limit: 20, offset: 40 });
    expect(toLimitOffset({ currentPage: 1, pageSize: 500 }).limit).toBe(200);
    expect(toLimitOffset({ mode: "off" })).toMatchObject({ limit: 200, offset: 0 });
  });

  it("prefers X-Total-Count and falls back to a 'maybe more' estimate", () => {
    expect(totalFrom(new Headers({ [TOTAL_HEADER]: "137" }), 20, 0, 20)).toBe(137);
    expect(totalFrom(new Headers(), 20, 40, 20)).toBe(61); // full page → one more
    expect(totalFrom(new Headers(), 7, 40, 20)).toBe(47); // short page → exact
    expect(totalFrom(new Headers({ [TOTAL_HEADER]: "nope" }), 3, 0, 20)).toBe(3);
  });
});

describe("filters", () => {
  const filters = [
    { field: "q", operator: "eq" as const, value: "ghee" },
    { field: "n", operator: "eq" as const, value: "12" },
    { field: "b", operator: "eq" as const, value: "false" },
    { field: "empty", operator: "eq" as const, value: "" },
  ];
  it("reads typed values and ignores blanks", () => {
    expect(filterValue(filters, "q")).toBe("ghee");
    expect(filterNumber(filters, "n")).toBe(12);
    expect(filterBool(filters, "b")).toBe(false);
    expect(filterValue(filters, "empty")).toBeUndefined();
    expect(filterNumber(filters, "missing")).toBeUndefined();
  });
  it("requireMeta throws a 400 HttpError when absent", () => {
    expect(requireMeta({ productId: 5 }, "productId", "A product")).toBe(5);
    expect(() => requireMeta({}, "productId", "A product")).toThrowError();
  });
  it("idem() makes a fresh key per call", () => {
    expect(idem()["Idempotency-Key"]).not.toBe(idem()["Idempotency-Key"]);
  });
});

describe("jwt", () => {
  it("reads the role claim", () => {
    expect(isAdminToken(jwt({ sub: "1", role: "admin" }))).toBe(true);
    expect(isAdminToken(jwt({ sub: "1", role: "customer" }))).toBe(false);
  });
  it("rejects garbage", () => {
    expect(decodeJwt("not-a-jwt")).toBeNull();
    expect(decodeJwt("a.###.c")).toBeNull();
    expect(isAdminToken(undefined)).toBe(false);
  });
});

describe("phone", () => {
  it("normalises Indian prefixes like the backend", () => {
    expect(normalizeIndianMobile("+91 98765 43210")).toBe("9876543210");
    expect(normalizeIndianMobile("09876543210")).toBe("9876543210");
    expect(isIndianMobile("98765-43210")).toBe(true);
    expect(isIndianMobile("5876543210")).toBe(false);
    expect(isIndianMobile("447700900123")).toBe(false);
  });
});

describe("form payloads", () => {
  it("toPayload trims, nulls blank nullable fields and drops NaN/unknown keys", () => {
    expect(
      toPayload<{ sku: string; hsn_code: string | null; gst_rate: number }>(
        { sku: " MILK-1 ", hsn_code: "", gst_rate: Number.NaN, extra: 1 },
        ["sku", "hsn_code", "gst_rate"],
        ["hsn_code"],
      ),
    ).toEqual({ sku: "MILK-1", hsn_code: null });
  });

  const fields: FieldDef[] = [
    { name: "code", label: "Code", createOnly: true },
    { name: "value", label: "Value", type: "number" },
    { name: "note", label: "Note", nullable: true },
    { name: "active", label: "Active", type: "checkbox", editOnly: true },
    { name: "meta", label: "Meta", type: "json" },
  ];
  it("buildPayload respects create/edit modes", () => {
    const values = { code: " ABC ", value: Number.NaN, note: "", active: true, meta: '{"a":1}' };
    expect(buildPayload(values, fields, "create")).toEqual({ code: "ABC", meta: { a: 1 } });
    expect(buildPayload(values, fields, "edit")).toEqual({ note: null, active: true, meta: { a: 1 } });
  });

  it("rulesFor validates numeric bounds and JSON", () => {
    const num = rulesFor({ name: "x", label: "X", type: "number", required: true, gt: 0, max: 10 });
    const v = num.validate as (v: unknown, all: Record<string, unknown>) => true | string;
    expect(v(Number.NaN, {})).toBe("X is required");
    expect(v(0, {})).toBe("Must be greater than 0");
    expect(v(11, {})).toMatch(/at most 10/);
    expect(v(5, {})).toBe(true);
    const json = rulesFor({ name: "j", label: "J", type: "json" }).validate as (
      v: unknown,
      a: object,
    ) => true | string;
    expect(json("{bad", {})).toBe("Must be valid JSON");
  });

  it("price windows: scheduled / active / expired", () => {
    expect(priceWindowState("2026-11-01", null, "2026-10-24")).toBe("scheduled");
    expect(priceWindowState("2026-01-01", "2026-10-01", "2026-10-24")).toBe("expired");
    expect(priceWindowState("2026-01-01", "2026-10-24", "2026-10-24")).toBe("active");
  });

  it("article tags: comma string → array", () => {
    expect(tagsToApi({ tags: " a2, ghee ,, " })).toEqual({ tags: ["a2", "ghee"] });
    expect(tagsToApi({ tags: " , " })).toEqual({ tags: null });
    expect(tagsToApi({ title: "x" })).toEqual({ title: "x" });
  });
});

describe("misc helpers", () => {
  it("listHref builds Refine's filter query", () => {
    expect(listHref("/refunds", { payment_id: 9 })).toBe(
      "/refunds?filters[0][field]=payment_id&filters[0][operator]=eq&filters[0][value]=9",
    );
    expect(listHref("/x", {})).toBe("/x");
  });
  it("humanize / money", () => {
    expect(humanize("partially_delivered")).toBe("Partially delivered");
    expect(humanize(null)).toBe("—");
    expect(money(1234.5)).toBe("₹1,234.50");
  });
  it("status tones", () => {
    expect(statusTone("delivered")).toBe("green");
    expect(statusTone("REJECTED")).toBe("maroon");
    expect(statusTone("in_transit")).toBe("neutral");
  });
  it("stock helpers", () => {
    expect(isLow({ qty_on_hand: 4, reorder_point: 5 })).toBe(true);
    expect(isLow({ qty_on_hand: 4, reorder_point: 0 })).toBe(false);
    expect(daysUntil("2026-10-26", "2026-10-24")).toBe(2);
    expect(daysUntil("2026-10-20", "2026-10-24")).toBe(-4);
  });
  it("fillDays makes a continuous series ending today", () => {
    const s = fillDays([{ date: "2026-10-23", revenue: 100, orders: 2 }], 3, "2026-10-24");
    expect(s.map((p) => [p.date, p.revenue])).toEqual([
      ["2026-10-22", 0],
      ["2026-10-23", 100],
      ["2026-10-24", 0],
    ]);
  });
  it("chart scales", () => {
    expect(niceTicks(870)).toEqual([0, 250, 500, 750, 1000]);
    expect(niceTicks(0)).toEqual([0, 1]);
    expect(compactINR(150000)).toBe("1.5L");
    expect(compactINR(23_000_000)).toBe("2.3Cr");
    expect(compactINR(1200)).toBe("1.2K");
  });
});
