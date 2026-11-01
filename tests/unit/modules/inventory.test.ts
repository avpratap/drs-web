import { describe, expect, it } from "vitest";
import { inventoryActions } from "@/modules/inventory/actions";
import { dataProvider, mockApi } from "../../helpers";

describe("inventory handlers", () => {
  it("stock lists and movements", async () => {
    const api = mockApi([
      { path: "/api/v1/admin/stock", body: [] },
      { path: "/api/v1/admin/stock/low", body: [] },
      { path: "/api/v1/admin/stock/reorder-suggestions", body: [] },
      { path: "/api/v1/admin/stock/7/movements", body: [] },
    ]);
    await dataProvider.getList({
      resource: "stock",
      filters: [{ field: "location_id", operator: "eq", value: "2" }],
    });
    await dataProvider.getList({ resource: "stock-low" });
    await dataProvider.getList({ resource: "reorder-suggestions" });
    await dataProvider.getList({ resource: "stock-movements", meta: { productId: 7 } });
    expect(api.calls[0].query.get("location_id")).toBe("2");
    expect(api.calls.map((c) => c.path)).toEqual([
      "/api/v1/admin/stock",
      "/api/v1/admin/stock/low",
      "/api/v1/admin/stock/reorder-suggestions",
      "/api/v1/admin/stock/7/movements",
    ]);
  });

  it("batches default to active only; receiving needs an idempotency key", async () => {
    const api = mockApi([
      { path: "/api/v1/admin/stock/batches", body: [] },
      { method: "POST", path: "/api/v1/admin/stock/batches", body: { id: 1 } },
    ]);
    await dataProvider.getList({ resource: "batches" });
    await dataProvider.getList({
      resource: "batches",
      filters: [{ field: "active_only", operator: "eq", value: "false" }],
    });
    await inventoryActions.receiveBatch({ product_id: 1, batch_no: "B1", qty: 5 });
    expect(api.calls[0].query.get("active_only")).toBe("true");
    expect(api.calls[1].query.get("active_only")).toBe("false");
    expect(api.calls[2].headers.get("idempotency-key")).toBeTruthy();
  });

  it("locations: getOne reads GET /admin/locations/{id} (no list scan)", async () => {
    const api = mockApi([
      { path: "/api/v1/admin/locations/2", body: { id: 2, name: "Hub" } },
      { path: "/api/v1/admin/locations/9", status: 404, body: { detail: "Location not found" } },
    ]);
    expect((await dataProvider.getOne({ resource: "locations", id: 2 })).data).toMatchObject({ name: "Hub" });
    await expect(dataProvider.getOne({ resource: "locations", id: 9 })).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(api.calls.map((c) => c.path)).toEqual(["/api/v1/admin/locations/2", "/api/v1/admin/locations/9"]);
  });

  it("stock adjust/wastage are idempotent; reorder point and expiry are not", async () => {
    const api = mockApi([
      { method: "POST", path: "/api/v1/admin/stock/adjust", body: {} },
      { method: "POST", path: "/api/v1/admin/stock/wastage", body: {} },
      { method: "POST", path: "/api/v1/admin/stock/reorder", body: {} },
      { method: "POST", path: "/api/v1/admin/stock/expire", body: {} },
    ]);
    await inventoryActions.adjustStock({ product_id: 1, change: -2, reason: "adjustment" });
    await inventoryActions.recordWastage({ product_id: 1, qty: 1 });
    await inventoryActions.setReorderPoint({ product_id: 1, reorder_point: 10 });
    await inventoryActions.expireBatches("2026-10-24");
    expect(api.calls[0].headers.get("idempotency-key")).toBeTruthy();
    expect(api.calls[1].headers.get("idempotency-key")).toBeTruthy();
    expect(api.calls[3].query.get("as_of")).toBe("2026-10-24");
  });

  it("document workflows: transfers, POs (GRN), production", async () => {
    const api = mockApi([
      { method: "POST", path: /\/api\/v1\/admin\/transfers\/\d+\/(dispatch|receive|cancel)/, body: {} },
      { method: "POST", path: /\/api\/v1\/admin\/purchase-orders\/\d+\/(place|receive|cancel)/, body: {} },
      { method: "POST", path: /\/api\/v1\/admin\/production-orders\/\d+\/(start|complete|cancel)/, body: {} },
    ]);
    await inventoryActions.dispatchTransfer(1);
    await inventoryActions.receiveTransfer(1);
    await inventoryActions.cancelTransfer(1);
    await inventoryActions.placePO(2);
    await inventoryActions.receivePO(2, { lines: [{ product_id: 1, qty_received: 3, batch_no: "B" }] });
    await inventoryActions.cancelPO(2);
    await inventoryActions.startProduction(3);
    await inventoryActions.completeProduction(3, { output_batch_no: "OUT1" });
    await inventoryActions.cancelProduction(3);
    expect(api.calls.map((c) => c.path.split("/").slice(-2).join("/"))).toEqual([
      "1/dispatch",
      "1/receive",
      "1/cancel",
      "2/place",
      "2/receive",
      "2/cancel",
      "3/start",
      "3/complete",
      "3/cancel",
    ]);
    expect(api.calls[4].headers.get("idempotency-key")).toBeTruthy();
    expect(api.calls[4].body).toEqual({ lines: [{ product_id: 1, qty_received: 3, batch_no: "B" }] });
  });

  it("creates send the document body", async () => {
    const api = mockApi([
      { method: "POST", path: "/api/v1/admin/transfers", body: { id: 1 } },
      { method: "POST", path: "/api/v1/admin/purchase-orders", body: { id: 1 } },
      { method: "POST", path: "/api/v1/admin/boms", body: { id: 1 } },
      { method: "POST", path: "/api/v1/admin/production-orders", body: { id: 1 } },
      { method: "POST", path: "/api/v1/admin/suppliers", body: { id: 1 } },
    ]);
    await dataProvider.create({
      resource: "transfers",
      variables: { to_location_id: 2, items: [{ product_id: 1, qty: 2 }] },
    });
    await dataProvider.create({ resource: "purchase-orders", variables: { supplier_id: 1, items: [] } });
    await dataProvider.create({
      resource: "boms",
      variables: { product_id: 1, name: "Dahi", components: [] },
    });
    await dataProvider.create({ resource: "production-orders", variables: { bom_id: 1, planned_qty: 10 } });
    await dataProvider.create({ resource: "suppliers", variables: { name: "Gwala Co" } });
    expect(api.calls[0].body).toEqual({ to_location_id: 2, items: [{ product_id: 1, qty: 2 }] });
    expect(api.calls).toHaveLength(5);
  });
});
