import { describe, expect, it } from "vitest";
import { normaliseDays, toItemsIn } from "@/components/operations/subscription-items-editor";
import { cadence } from "@/modules/operations/cadence";
import { operationsActions } from "@/modules/operations/handlers";
import { dataProvider, mockApi } from "../../helpers";

describe("operations handlers", () => {
  it("returns: list filters + detail", async () => {
    const api = mockApi([
      { path: "/api/v1/admin/returns", body: [], headers: { "x-total-count": "0" } },
      { path: "/api/v1/admin/returns/4", body: { id: 4 } },
    ]);
    await dataProvider.getList({
      resource: "returns",
      filters: [
        { field: "status", operator: "eq", value: "approved" },
        { field: "order_id", operator: "eq", value: "12" },
      ],
    });
    await dataProvider.getOne({ resource: "returns", id: 4 });
    expect([api.calls[0].query.get("status_filter"), api.calls[0].query.get("order_id")]).toEqual([
      "approved",
      "12",
    ]);
    expect(api.calls[1].path).toBe("/api/v1/admin/returns/4");
  });

  it("subscriptions, shops, users and cutoff map filters to API names", async () => {
    const api = mockApi([
      { path: "/api/v1/admin/subscriptions", body: [] },
      { path: "/api/v1/admin/subscriptions/2", body: { id: 2 } },
      { path: "/api/v1/admin/shops", body: [] },
      { path: "/api/v1/admin/shops/3", body: { id: 3 } },
      { path: "/api/v1/admin/users", body: [] },
      { path: "/api/v1/admin/cutoff/runs", body: [] },
      { path: "/api/v1/admin/cutoff/status", body: { cutoff_hour: 23 } },
    ]);
    await dataProvider.getList({
      resource: "subscriptions",
      filters: [
        { field: "status", operator: "eq", value: "paused" },
        { field: "shop_id", operator: "eq", value: "7" },
      ],
    });
    await dataProvider.getOne({ resource: "subscriptions", id: 2 });
    await dataProvider.getList({
      resource: "shops",
      filters: [
        { field: "q", operator: "eq", value: "302001" },
        { field: "price_tier_id", operator: "eq", value: "2" },
      ],
    });
    await dataProvider.getOne({ resource: "shops", id: 3 });
    await dataProvider.getList({
      resource: "users",
      filters: [{ field: "role", operator: "eq", value: "delivery" }],
    });
    await dataProvider.getList({
      resource: "cutoff-runs",
      filters: [{ field: "status", operator: "eq", value: "failed" }],
    });
    const status = await dataProvider.getOne({ resource: "cutoff-status", id: "status" });
    expect([api.calls[0].query.get("status_filter"), api.calls[0].query.get("shop_id")]).toEqual([
      "paused",
      "7",
    ]);
    expect([api.calls[2].query.get("q"), api.calls[2].query.get("price_tier_id")]).toEqual(["302001", "2"]);
    expect(api.calls[4].query.get("role")).toBe("delivery");
    expect(api.calls[5].query.get("status_filter")).toBe("failed");
    expect(status.data).toMatchObject({ id: "status", cutoff_hour: 23 });
  });

  it("actions hit the right endpoints with the right bodies", async () => {
    const api = mockApi([
      { method: "POST", path: /\/api\/v1\/admin\/returns\/5\/(approve|reject|refund)/, body: {} },
      { method: "PUT", path: "/api/v1/subscriptions/2/items", body: {} },
      { method: "POST", path: /\/api\/v1\/subscriptions\/2\/(pause|resume|cancel)/, body: {} },
      { method: "POST", path: "/api/v1/admin/shops/3/tier", body: {} },
      { method: "PATCH", path: "/api/v1/admin/shops/3", body: {} },
      { method: "POST", path: "/api/v1/admin/delivery-assignments", body: {} },
      { method: "DELETE", path: "/api/v1/admin/delivery-assignments/9", status: 204 },
      { method: "POST", path: "/api/v1/admin/cutoff/run", body: {} },
    ]);
    await operationsActions.approveReturn(5);
    await operationsActions.rejectReturn(5, { note: "used" });
    await operationsActions.refundReturn(5, { amount: 40 });
    await operationsActions.setSubscriptionItems(2, [{ product_id: 1, default_qty: 2, frequency: "daily" }]);
    await operationsActions.pauseSubscription(2);
    await operationsActions.resumeSubscription(2);
    await operationsActions.cancelSubscription(2);
    await operationsActions.setShopTier(3, 2);
    await operationsActions.setShopStatus(3, "inactive");
    await operationsActions.assignDriver(3, 8);
    await operationsActions.unassignDriver(9);
    await operationsActions.runCutoff("2026-10-26", false);
    const sig = api.calls.map((c) => `${c.method} ${c.path}`);
    expect(sig).toEqual([
      "POST /api/v1/admin/returns/5/approve",
      "POST /api/v1/admin/returns/5/reject",
      "POST /api/v1/admin/returns/5/refund",
      "PUT /api/v1/subscriptions/2/items",
      "POST /api/v1/subscriptions/2/pause",
      "POST /api/v1/subscriptions/2/resume",
      "POST /api/v1/subscriptions/2/cancel",
      "POST /api/v1/admin/shops/3/tier",
      "PATCH /api/v1/admin/shops/3",
      "POST /api/v1/admin/delivery-assignments",
      "DELETE /api/v1/admin/delivery-assignments/9",
      "POST /api/v1/admin/cutoff/run",
    ]);
    expect(api.calls[1].body).toEqual({ note: "used" });
    expect(api.calls[2].body).toEqual({ amount: 40 });
    expect(api.calls[7].body).toEqual({ price_tier_id: 2 });
    expect(api.calls[8].body).toEqual({ status: "inactive" });
    expect(api.calls[9].body).toEqual({ shop_id: 3, delivery_id: 8 });
    expect([api.calls[11].query.get("date"), api.calls[11].query.get("force")]).toEqual([
      "2026-10-26",
      "false",
    ]);
  });
});

describe("standing-order helpers", () => {
  it("cadence labels", () => {
    expect(cadence({ frequency: "daily" })).toBe("Daily");
    expect(cadence({ frequency: "alternate", interval_days: 2 })).toBe("Every 2 days");
    expect(cadence({ frequency: "weekly", days_of_week: "1,3,5" })).toBe("Mon, Wed, Fri");
  });

  it("item rows → API payload drops fields that don't apply to the frequency", () => {
    expect(normaliseDays(" 1, 3 ,5,")).toBe("1,3,5");
    expect(
      toItemsIn([
        { product_id: 1, default_qty: 2, frequency: "daily", interval_days: 3, days_of_week: "1" },
        { product_id: 2, default_qty: 1, frequency: "alternate", interval_days: 2, days_of_week: "" },
        { product_id: 3, default_qty: 0.5, frequency: "weekly", days_of_week: "1, 4" },
      ]),
    ).toEqual([
      { product_id: 1, default_qty: 2, frequency: "daily", interval_days: null, days_of_week: null },
      { product_id: 2, default_qty: 1, frequency: "alternate", interval_days: 2, days_of_week: null },
      { product_id: 3, default_qty: 0.5, frequency: "weekly", interval_days: null, days_of_week: "1,4" },
    ]);
  });
});
