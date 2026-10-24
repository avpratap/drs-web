import { describe, expect, it } from "vitest";
import { deliveryActions, mediaUrl } from "@/modules/delivery/actions";
import { todayIST } from "@/lib/forms";
import { dataProvider, mockApi } from "../../helpers";

describe("delivery handlers", () => {
  it("daily orders default to today (IST) and accept a date", async () => {
    const api = mockApi([{ path: "/api/v1/delivery/orders", body: [] }]);
    await dataProvider.getList({ resource: "delivery-orders" });
    await dataProvider.getList({
      resource: "delivery-orders",
      filters: [{ field: "date", operator: "eq", value: "2026-10-25" }],
    });
    expect(api.calls[0].query.get("date")).toBe(todayIST());
    expect(api.calls[1].query.get("date")).toBe("2026-10-25");
  });

  it("detail is the fulfilment record; summary is keyed by date", async () => {
    const api = mockApi([
      {
        path: "/api/v1/admin/delivery-orders/5/fulfillment",
        body: { order: { id: 5 }, pod: [], cash: [], returns: [] },
      },
      {
        path: "/api/v1/delivery/summary",
        body: { date: "2026-10-24", delivered: 3, failed: 0, pending: 1, cash_collected: 90 },
      },
    ]);
    expect((await dataProvider.getOne({ resource: "delivery-orders", id: 5 })).data).toMatchObject({
      order: { id: 5 },
    });
    const s = await dataProvider.getOne({ resource: "delivery-summary", id: "2026-10-24" });
    expect(s.data).toMatchObject({ id: "2026-10-24", delivered: 3 });
    expect(api.calls[1].query.get("date")).toBe("2026-10-24");
  });

  it("admin orders filters + actions", async () => {
    const api = mockApi([
      { path: "/api/v1/admin/orders", body: [] },
      { method: "POST", path: "/api/v1/admin/orders/8/cancel", body: {} },
      { method: "POST", path: "/api/v1/delivery/orders/5/fail", body: {} },
      { method: "POST", path: "/api/v1/admin/invoices/generate", body: {} },
    ]);
    await dataProvider.getList({
      resource: "orders",
      filters: [{ field: "payment_status", operator: "eq", value: "paid" }],
    });
    await deliveryActions.cancelOrder(8);
    await deliveryActions.markFailed(5, { reason: "refused" });
    await deliveryActions.generateInvoice(5);
    expect(api.calls[0].query.get("payment_status")).toBe("paid");
    expect(api.calls[2].body).toEqual({ reason: "refused" });
    expect(api.calls[3].query.get("delivery_order_id")).toBe("5");
  });

  it("mediaUrl only allows http(s) and API-relative signed links", () => {
    expect(mediaUrl("https://cdn/x.jpg")).toBe("https://cdn/x.jpg");
    expect(mediaUrl("/files/pod/a.png?sig=1")).toMatch(/\/files\/pod\/a\.png\?sig=1$/);
    expect(mediaUrl("javascript:alert(1)")).toBeNull();
    expect(mediaUrl(null)).toBeNull();
  });
});
