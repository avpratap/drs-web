import { describe, expect, it } from "vitest";
import { billingActions } from "@/modules/billing/actions";
import { dataProvider, mockApi } from "../../helpers";

describe("billing handlers", () => {
  it("accounts search, detail and both ledgers", async () => {
    const api = mockApi([
      { path: "/api/v1/admin/accounts", body: [{ id: 1 }], headers: { "x-total-count": "1" } },
      { path: "/api/v1/admin/accounts/1", body: { id: 1 } },
      { path: "/api/v1/admin/accounts/1/wallet/transactions", body: [], headers: { "x-total-count": "0" } },
      { path: "/api/v1/admin/accounts/1/credit/ledger", body: [] },
    ]);
    await dataProvider.getList({
      resource: "accounts",
      filters: [{ field: "q", operator: "eq", value: "98" }],
    });
    await dataProvider.getOne({ resource: "accounts", id: 1 });
    await dataProvider.getList({ resource: "wallet-transactions", meta: { accountId: 1 } });
    await dataProvider.getList({ resource: "credit-ledger", meta: { accountId: 1 } });
    expect(api.calls[0].query.get("q")).toBe("98");
    expect(api.calls.map((c) => c.path)).toContain("/api/v1/admin/accounts/1/credit/ledger");
    await expect(dataProvider.getList({ resource: "credit-ledger" })).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("payments/refunds/withdrawals map filters to the API's query names", async () => {
    const api = mockApi([
      { path: "/api/v1/admin/payments", body: [] },
      { path: "/api/v1/admin/refunds", body: [] },
      { path: "/api/v1/admin/withdrawals", body: [] },
    ]);
    await dataProvider.getList({
      resource: "payments",
      filters: [
        { field: "status", operator: "eq", value: "success" },
        { field: "date_from", operator: "eq", value: "2026-10-01" },
        { field: "account_id", operator: "eq", value: "4" },
      ],
    });
    await dataProvider.getList({
      resource: "refunds",
      filters: [{ field: "payment_id", operator: "eq", value: 8 }],
    });
    await dataProvider.getList({
      resource: "withdrawals",
      filters: [{ field: "status", operator: "eq", value: "requested" }],
    });
    expect(api.calls[0].query.get("status_filter")).toBe("success");
    expect(api.calls[0].query.get("date_from")).toBe("2026-10-01");
    expect(api.calls[0].query.get("account_id")).toBe("4");
    expect(api.calls[1].query.get("payment_id")).toBe("8");
    expect(api.calls[2].query.get("status_filter")).toBe("requested");
  });

  it("money-moving actions send an Idempotency-Key", async () => {
    const api = mockApi([
      { method: "POST", path: "/api/v1/billing/admin/topup", body: {} },
      { method: "POST", path: "/api/v1/admin/accounts/2/wallet/adjust", body: {} },
      { method: "POST", path: "/api/v1/admin/accounts/2/credit/settle", body: {} },
      { method: "POST", path: "/api/v1/payments/5/refund", body: {} },
    ]);
    await billingActions.topup(2, { amount: 100 });
    await billingActions.adjustWallet(2, { amount: -5, reason: "fix" });
    await billingActions.settleCredit(2, { amount: 50 });
    await billingActions.refundPayment(5, { amount: 10 });
    for (const c of api.calls) expect(c.headers.get("idempotency-key"), c.path).toBeTruthy();
    expect(api.calls[0].body).toEqual({ account_id: 2, amount: 100 });
    expect(new Set(api.calls.map((c) => c.headers.get("idempotency-key"))).size).toBe(4);
  });

  it("withdrawal decisions, refund reconcile, account type and tier", async () => {
    const api = mockApi([
      { method: "POST", path: "/api/v1/admin/withdrawals/3/approve", body: {} },
      { method: "POST", path: "/api/v1/admin/withdrawals/3/reject", body: {} },
      { method: "POST", path: "/api/v1/payments/refunds/4/reconcile", body: {} },
      { method: "PATCH", path: "/api/v1/admin/accounts/2/type", body: {} },
      { method: "POST", path: "/api/v1/admin/accounts/2/tier", body: {} },
    ]);
    await billingActions.approveWithdrawal(3);
    await billingActions.rejectWithdrawal(3);
    await billingActions.reconcileRefund(4, { outcome: "processed" });
    await billingActions.setAccountType(2, { account_type: "b2b" });
    await billingActions.setAccountTier(2, { price_tier_id: 1 });
    expect(api.calls).toHaveLength(5);
    expect(api.calls[2].body).toEqual({ outcome: "processed" });
  });

  it("surfaces backend errors as HttpErrors", async () => {
    mockApi([
      {
        method: "POST",
        path: "/api/v1/admin/withdrawals/3/approve",
        status: 409,
        body: { detail: "Insufficient wallet balance" },
      },
    ]);
    await expect(billingActions.approveWithdrawal(3)).rejects.toMatchObject({
      statusCode: 409,
      message: "Insufficient wallet balance",
    });
  });
});
