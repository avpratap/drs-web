import { describe, expect, it } from "vitest";
import { customerActions } from "@/modules/customers/handlers";
import { dataProvider, mockApi } from "../../helpers";

describe("customer handlers", () => {
  it("tickets list/detail use admin endpoints", async () => {
    const api = mockApi([
      { path: "/api/v1/admin/support/tickets", body: [] },
      { path: "/api/v1/admin/support/tickets/2", body: { id: 2, messages: [] } },
    ]);
    await dataProvider.getList({
      resource: "tickets",
      filters: [
        { field: "status", operator: "eq", value: "open" },
        { field: "category", operator: "eq", value: "delivery" },
      ],
    });
    await dataProvider.getOne({ resource: "tickets", id: 2 });
    expect([api.calls[0].query.get("status_filter"), api.calls[0].query.get("category")]).toEqual([
      "open",
      "delivery",
    ]);
  });

  it("ratings, coupons and their actions", async () => {
    const api = mockApi([
      { path: "/api/v1/admin/ratings", body: [] },
      { path: "/api/v1/admin/coupons", body: [] },
      { method: "POST", path: "/api/v1/admin/coupons", body: { id: 1 } },
      { method: "PATCH", path: "/api/v1/admin/coupons/1", body: { id: 1 } },
      { method: "POST", path: "/api/v1/admin/coupons/1/deactivate", body: {} },
      { method: "POST", path: "/api/v1/admin/ratings/5/moderate", body: {} },
      { method: "POST", path: "/api/v1/admin/ratings/5/reply", body: {} },
      { method: "POST", path: "/api/v1/admin/support/tickets/2/messages", body: {} },
      { method: "POST", path: "/api/v1/admin/support/tickets/2/status", body: {} },
    ]);
    await dataProvider.getList({
      resource: "ratings",
      filters: [{ field: "status", operator: "eq", value: "pending" }],
    });
    await dataProvider.getList({
      resource: "coupons",
      filters: [{ field: "active", operator: "eq", value: "true" }],
    });
    await dataProvider.create({ resource: "coupons", variables: { code: "MONSOON10" } });
    await dataProvider.update({ resource: "coupons", id: 1, variables: { active: false } });
    await customerActions.deactivateCoupon(1);
    await customerActions.moderateRating(5, "approved");
    await customerActions.replyRating(5, { reply: "Thanks!" });
    await customerActions.replyTicket(2, { body: "On it" });
    await customerActions.setTicketStatus(2, "resolved");
    expect(api.calls[0].query.get("status_filter")).toBe("pending");
    expect(api.calls[1].query.get("active")).toBe("true");
    expect(api.calls[5].body).toEqual({ status: "approved" });
    expect(api.calls[8].body).toEqual({ status: "resolved" });
  });
});
