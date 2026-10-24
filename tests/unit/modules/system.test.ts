import { describe, expect, it } from "vitest";
import { systemActions } from "@/modules/system/handlers";
import { dataProvider, mockApi } from "../../helpers";

describe("system handlers", () => {
  it("audit log filters", async () => {
    const api = mockApi([{ path: "/api/v1/admin/audit-log", body: [], headers: { "x-total-count": "120" } }]);
    const r = await dataProvider.getList({
      resource: "audit-log",
      pagination: { currentPage: 2, pageSize: 50 },
      filters: [
        { field: "action", operator: "eq", value: "POST /x" },
        { field: "admin_user_id", operator: "eq", value: "1" },
      ],
    });
    expect(r.total).toBe(120);
    expect([
      api.calls[0].query.get("action"),
      api.calls[0].query.get("admin_user_id"),
      api.calls[0].query.get("offset"),
    ]).toEqual(["POST /x", "1", "50"]);
  });

  it("feature flags are keyed by key and upserted with PUT", async () => {
    const api = mockApi([
      { path: "/api/v1/admin/feature-flags", body: [{ key: "b2b.credit", enabled: true }] },
      { path: "/api/v1/admin/feature-flags/b2b.credit", body: { key: "b2b.credit", enabled: true } },
      { method: "PUT", path: "/api/v1/admin/feature-flags", body: { key: "x", enabled: false } },
    ]);
    const list = await dataProvider.getList({ resource: "feature-flags" });
    expect(list.data[0]).toMatchObject({ id: "b2b.credit" });
    expect((await dataProvider.getOne({ resource: "feature-flags", id: "b2b.credit" })).data).toMatchObject({
      id: "b2b.credit",
    });
    await systemActions.upsertFlag({ key: "x", enabled: false });
    expect(api.calls[2]).toMatchObject({ method: "PUT", body: { key: "x", enabled: false } });
  });
});
