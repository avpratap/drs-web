import { api } from "@/lib/api/browser";
import type { components } from "@/lib/api/client";
import { idem, unwrap } from "@/lib/api/resource";

type S = components["schemas"];
type V = Record<string, unknown>;

export const billingActions = {
  topup: (accountId: number, v: V) =>
    unwrap(
      api.POST("/api/v1/billing/admin/topup", {
        params: { header: idem(["topup", accountId, v.amount]) },
        body: { account_id: accountId, amount: v.amount as number },
      }),
    ),
  adjustWallet: (accountId: number, v: V) =>
    unwrap(
      api.POST("/api/v1/admin/accounts/{account_id}/wallet/adjust", {
        params: { path: { account_id: accountId }, header: idem(["wallet-adjust", accountId, v]) },
        body: v as S["WalletAdjustIn"],
      }),
    ),
  settleCredit: (accountId: number, v: V) =>
    unwrap(
      api.POST("/api/v1/admin/accounts/{account_id}/credit/settle", {
        params: { path: { account_id: accountId }, header: idem(["credit-settle", accountId, v]) },
        body: v as S["CreditSettleIn"],
      }),
    ),
  setAccountType: (accountId: number, v: V) =>
    unwrap(
      api.PATCH("/api/v1/admin/accounts/{account_id}/type", {
        params: { path: { account_id: accountId } },
        body: v as S["AccountTypeIn"],
      }),
    ),
  setAccountTier: (accountId: number, v: V) =>
    unwrap(
      api.POST("/api/v1/admin/accounts/{account_id}/tier", {
        params: { path: { account_id: accountId } },
        body: v as S["TierAssignIn"],
      }),
    ),
  approveWithdrawal: (id: number) =>
    unwrap(
      api.POST("/api/v1/admin/withdrawals/{wd_id}/approve", {
        params: { path: { wd_id: id } },
        headers: idem(["withdrawal-approve", id]),
      }),
    ),
  rejectWithdrawal: (id: number) =>
    unwrap(
      api.POST("/api/v1/admin/withdrawals/{wd_id}/reject", {
        params: { path: { wd_id: id } },
        headers: idem(["withdrawal-reject", id]),
      }),
    ),
  refundPayment: (paymentId: number, v: V) =>
    unwrap(
      api.POST("/api/v1/payments/{payment_id}/refund", {
        params: { path: { payment_id: paymentId }, header: idem(["refund", paymentId, v]) },
        body: v as S["app__schemas__payment__RefundIn"],
      }),
    ),
  reconcileRefund: (refundId: number, v: V) =>
    unwrap(
      api.POST("/api/v1/payments/refunds/{refund_id}/reconcile", {
        params: { path: { refund_id: refundId } },
        headers: idem(["refund-reconcile", refundId, v]),
        body: v as S["RefundReconcileIn"],
      }),
    ),
};
