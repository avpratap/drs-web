import { api } from "@/lib/api/browser";
import {
  filterNumber,
  filterValue,
  num,
  pagedList,
  requireMeta,
  unwrap,
  type Handlers,
} from "@/lib/api/resource";

export const billingHandlers: Handlers = {
  accounts: {
    list: ({ pagination, filters }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/accounts", { params: { query: { ...page, q: filterValue(filters, "q") } } }),
      ),
    one: (id) =>
      unwrap(api.GET("/api/v1/admin/accounts/{account_id}", { params: { path: { account_id: num(id) } } })),
  },
  "wallet-transactions": {
    list: ({ pagination, meta }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/accounts/{account_id}/wallet/transactions", {
          params: { path: { account_id: requireMeta(meta, "accountId", "An account") }, query: page },
        }),
      ),
  },
  "credit-ledger": {
    list: ({ pagination, meta }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/accounts/{account_id}/credit/ledger", {
          params: { path: { account_id: requireMeta(meta, "accountId", "An account") }, query: page },
        }),
      ),
  },
  withdrawals: {
    list: ({ pagination, filters }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/withdrawals", {
          params: { query: { ...page, status_filter: filterValue(filters, "status") } },
        }),
      ),
  },
  payments: {
    list: ({ pagination, filters }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/payments", {
          params: {
            query: {
              ...page,
              status_filter: filterValue(filters, "status"),
              account_id: filterNumber(filters, "account_id"),
              ref_type: filterValue(filters, "ref_type"),
              date_from: filterValue(filters, "date_from"),
              date_to: filterValue(filters, "date_to"),
            },
          },
        }),
      ),
    one: (id) =>
      unwrap(api.GET("/api/v1/admin/payments/{payment_id}", { params: { path: { payment_id: num(id) } } })),
  },
  refunds: {
    list: ({ pagination, filters }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/refunds", {
          params: {
            query: {
              ...page,
              status_filter: filterValue(filters, "status"),
              payment_id: filterNumber(filters, "payment_id"),
              account_id: filterNumber(filters, "account_id"),
            },
          },
        }),
      ),
    one: (id) =>
      unwrap(api.GET("/api/v1/admin/refunds/{refund_id}", { params: { path: { refund_id: num(id) } } })),
  },
};
