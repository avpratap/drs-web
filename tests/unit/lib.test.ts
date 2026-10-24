import { describe, expect, it } from "vitest";
import { pageResult, toLimitOffset } from "@/lib/api/pagination";
import { decodeJwt, isAdminToken } from "@/lib/auth/jwt";
import { priceWindowState, toPayload } from "@/lib/forms";
import { isIndianMobile, normalizeIndianMobile } from "@/lib/phone";

const b64url = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (claims: object) => `${b64url({ alg: "HS256" })}.${b64url(claims)}.sig`;

describe("pagination", () => {
  it("probes one extra row and reports a total that enables 'next'", () => {
    const { limit, offset, pageSize } = toLimitOffset({ currentPage: 2, pageSize: 20 });
    expect({ limit, offset }).toEqual({ limit: 21, offset: 20 });
    const rows = Array.from({ length: 21 }, (_, i) => i);
    const r = pageResult(rows, offset, pageSize);
    expect(r.data).toHaveLength(20);
    expect(r.total).toBeGreaterThan(2 * 20);
  });

  it("reports an exact total on the last page", () => {
    expect(pageResult([1, 2, 3], 40, 20).total).toBe(43);
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

describe("forms", () => {
  it("toPayload trims, nulls blank nullable fields and drops NaN/unknown keys", () => {
    expect(
      toPayload<{ sku: string; hsn_code: string | null; gst_rate: number }>(
        { sku: " MILK-1 ", hsn_code: "", gst_rate: Number.NaN, extra: 1 },
        ["sku", "hsn_code", "gst_rate"],
        ["hsn_code"],
      ),
    ).toEqual({ sku: "MILK-1", hsn_code: null });
  });

  it("classifies price validity windows", () => {
    expect(priceWindowState("2026-11-01", null, "2026-10-24")).toBe("scheduled");
    expect(priceWindowState("2026-01-01", "2026-10-01", "2026-10-24")).toBe("expired");
    expect(priceWindowState("2026-01-01", "2026-10-24", "2026-10-24")).toBe("active");
  });
});
