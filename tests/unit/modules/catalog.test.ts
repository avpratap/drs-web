import { describe, expect, it } from "vitest";
import { dataProvider, mockApi } from "../../helpers";

describe("catalog handlers", () => {
  it("products list uses the admin endpoint with status/q and the total header", async () => {
    const api = mockApi([
      {
        path: "/api/v1/admin/products",
        body: [{ id: 1, sku: "A", name: "A", status: "retired" }],
        headers: { "x-total-count": "41" },
      },
    ]);
    const r = await dataProvider.getList({
      resource: "products",
      pagination: { currentPage: 2, pageSize: 20 },
      filters: [
        { field: "q", operator: "eq", value: "milk" },
        { field: "status", operator: "eq", value: "retired" },
      ],
    });
    expect(r.total).toBe(41);
    const q = api.calls[0].query;
    expect([q.get("q"), q.get("status"), q.get("limit"), q.get("offset")]).toEqual([
      "milk",
      "retired",
      "20",
      "20",
    ]);
  });

  it("products default to status=all", async () => {
    const api = mockApi([{ path: "/api/v1/admin/products", body: [] }]);
    await dataProvider.getList({ resource: "products" });
    expect(api.calls[0].query.get("status")).toBe("all");
  });

  it("product CRUD hits the right verbs", async () => {
    const api = mockApi([
      { method: "POST", path: "/api/v1/products", body: { id: 9 } },
      { method: "PATCH", path: "/api/v1/products/9", body: { id: 9 } },
      { method: "DELETE", path: "/api/v1/products/9", status: 204 },
      { path: "/api/v1/products/9", body: { id: 9 } },
    ]);
    await dataProvider.create({ resource: "products", variables: { sku: "S", name: "N" } });
    await dataProvider.update({ resource: "products", id: 9, variables: { name: "M" } });
    await dataProvider.getOne({ resource: "products", id: 9 });
    await dataProvider.deleteOne({ resource: "products", id: 9 });
    expect(api.calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      "POST /api/v1/products",
      "PATCH /api/v1/products/9",
      "GET /api/v1/products/9",
      "DELETE /api/v1/products/9",
    ]);
    expect(api.calls[1].body).toEqual({ name: "M" });
  });

  it("variants: list needs a product, getOne uses GET /products/variants/{id}", async () => {
    const api = mockApi([
      { path: "/api/v1/products/4/variants", body: [{ id: 1 }] },
      { path: "/api/v1/products/variants/12", body: { id: 12 } },
    ]);
    await dataProvider.getList({ resource: "variants", meta: { productId: 4 } });
    expect(api.calls[0].query.get("all")).toBe("true");
    expect((await dataProvider.getOne({ resource: "variants", id: 12 })).data).toEqual({ id: 12 });
    await expect(dataProvider.getList({ resource: "variants" })).rejects.toMatchObject({ statusCode: 400 });
  });

  it("maps 422 validation errors onto fields", async () => {
    mockApi([
      {
        method: "POST",
        path: "/api/v1/admin/price-tiers",
        status: 422,
        body: { detail: [{ loc: ["body", "code"], msg: "too short" }] },
      },
    ]);
    await expect(
      dataProvider.create({ resource: "price-tiers", variables: { code: "x" } }),
    ).rejects.toMatchObject({
      statusCode: 422,
      errors: { code: "too short" },
    });
  });

  it("product prices filter by product", async () => {
    const api = mockApi([{ path: "/api/v1/admin/product-prices", body: [] }]);
    await dataProvider.getList({
      resource: "product-prices",
      filters: [{ field: "product_id", operator: "eq", value: "3" }],
    });
    expect(api.calls[0].query.get("product_id")).toBe("3");
  });
});
