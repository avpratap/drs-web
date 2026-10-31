import { afterEach, describe, expect, it, vi } from "vitest";
import { planVersion } from "@/components/store/b2b/subscription-detail";
import { MAX_PACKS } from "@/components/store/purchase-panel";
import { txnPager, TXNS_PER_PAGE } from "@/components/store/wallet-view";
import { api } from "@/lib/api/browser";
import { contentSecurityPolicy } from "@/lib/security-headers";
import { latestBalance, type CreditLine } from "@/modules/store/b2b";

const line = (id: number, created_at: string, balance_after: number): CreditLine => ({
  id,
  entry_type: "charge",
  amount: 1,
  balance_after,
  created_at,
});

describe("W5: product details aren't cached when the read fails", () => {
  afterEach(() => vi.restoreAllMocks());
  it("asks again after a failure, but reuses a success", async () => {
    const { loadProduct } = await import("@/components/store/use-products");
    const get = vi
      .spyOn(api, "GET")
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockResolvedValue({ data: { id: 991, name: "Milk" }, response: new Response() } as never);
    expect(await loadProduct(991)).toBeNull();
    expect((await loadProduct(991))?.name).toBe("Milk");
    expect((await loadProduct(991))?.name).toBe("Milk");
    expect(get).toHaveBeenCalledTimes(2);
  });
});

describe("W6: credit outstanding is the latest line, whatever the order", () => {
  it("picks the newest by date, then id", () => {
    const rows = [
      line(1, "2026-10-01T09:00:00Z", 1320),
      line(3, "2026-10-03T09:00:00Z", 1520),
      line(2, "2026-10-02T09:00:00Z", 1640),
    ];
    expect(latestBalance(rows)).toBe(1520);
    expect(latestBalance([...rows].reverse())).toBe(1520);
    expect(latestBalance([line(4, "2026-10-03T09:00:00Z", 10), line(5, "2026-10-03T09:00:00Z", 20)])).toBe(
      20,
    );
  });
});

describe("W7: wallet pager without X-Total-Count", () => {
  it("offers older pages when a full page came back", () => {
    expect(txnPager(1, TXNS_PER_PAGE, null)).toEqual({ hasOlder: true, label: `1–${TXNS_PER_PAGE}` });
    expect(txnPager(2, 3, null)).toEqual({
      hasOlder: false,
      label: `${TXNS_PER_PAGE + 1}–${TXNS_PER_PAGE + 3}`,
    });
    expect(txnPager(1, 20, 45)).toEqual({ hasOlder: true, label: "1–20 of 45" });
    expect(txnPager(3, 5, 45)).toEqual({ hasOlder: false, label: "41–45 of 45" });
  });
});

describe("W8 + W9 + W13", () => {
  it("one pack limit for the PDP and the cart", () => {
    expect(MAX_PACKS).toBe(50);
  });
  it("the day plan refetches when the standing order changes, not otherwise", () => {
    const item = {
      id: 1,
      product_id: 1,
      default_qty: 20000,
      frequency: "daily",
      interval_days: null,
      days_of_week: null,
      active: true,
    };
    const base = { status: "active", items: [item] };
    expect(planVersion(base)).toBe(planVersion({ ...base, items: [{ ...item }] }));
    expect(planVersion(base)).not.toBe(planVersion({ ...base, items: [{ ...item, default_qty: 25000 }] }));
    expect(planVersion(base)).not.toBe(planVersion({ ...base, status: "paused" }));
  });
  it("CSP allows blob: workers (Razorpay Checkout)", () => {
    expect(contentSecurityPolicy({})).toContain("worker-src 'self' blob:");
  });
});
