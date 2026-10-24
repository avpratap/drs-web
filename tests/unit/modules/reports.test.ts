import { describe, expect, it } from "vitest";
import { dataProvider, mockApi } from "../../helpers";

describe("report handlers", () => {
  it("summary/overview and windowed analytics", async () => {
    const api = mockApi([
      { path: "/api/v1/admin/reports/summary", body: { paid_order_revenue: 10 } },
      { path: "/api/v1/admin/analytics/overview", body: { orders: 3 } },
      { path: "/api/v1/admin/analytics/revenue", body: [{ date: "2026-10-24", revenue: 5, orders: 1 }] },
      { path: "/api/v1/admin/analytics/top-products", body: [] },
    ]);
    expect((await dataProvider.getOne({ resource: "reports", id: "summary" })).data).toMatchObject({
      paid_order_revenue: 10,
    });
    expect((await dataProvider.getOne({ resource: "reports", id: "overview" })).data).toMatchObject({
      orders: 3,
    });
    const rev = await dataProvider.getList({
      resource: "analytics-revenue",
      filters: [{ field: "days", operator: "eq", value: 7 }],
    });
    await dataProvider.getList({ resource: "analytics-top-products" });
    expect(rev.total).toBe(1);
    expect(api.calls[2].query.get("days")).toBe("7");
    expect([api.calls[3].query.get("days"), api.calls[3].query.get("limit")]).toEqual(["30", "10"]);
  });
});
