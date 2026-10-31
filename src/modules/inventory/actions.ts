import { api } from "@/lib/api/browser";
import type { components } from "@/lib/api/client";
import { idem, unwrap } from "@/lib/api/resource";

type S = components["schemas"];
type V = Record<string, unknown>;

export const inventoryActions = {
  adjustStock: (v: V) =>
    unwrap(
      api.POST("/api/v1/admin/stock/adjust", {
        params: { header: idem(["stock-adjust", v]) },
        body: v as S["StockAdjustIn"],
      }),
    ),
  recordWastage: (v: V) =>
    unwrap(
      api.POST("/api/v1/admin/stock/wastage", {
        params: { header: idem(["stock-wastage", v]) },
        body: v as S["WastageIn"],
      }),
    ),
  setReorderPoint: (v: V) => unwrap(api.POST("/api/v1/admin/stock/reorder", { body: v as S["ReorderIn"] })),
  receiveBatch: (v: V) =>
    unwrap(
      api.POST("/api/v1/admin/stock/batches", {
        params: { header: idem(["batch-receive", v]) },
        body: v as S["BatchIn"],
      }),
    ),
  expireBatches: (asOf?: string) =>
    unwrap(api.POST("/api/v1/admin/stock/expire", { params: { query: { as_of: asOf || undefined } } })),
  dispatchTransfer: (id: number) =>
    unwrap(
      api.POST("/api/v1/admin/transfers/{transfer_id}/dispatch", {
        params: { path: { transfer_id: id } },
        headers: idem(["transfer-dispatch", id]),
      }),
    ),
  receiveTransfer: (id: number) =>
    unwrap(
      api.POST("/api/v1/admin/transfers/{transfer_id}/receive", {
        params: { path: { transfer_id: id } },
        headers: idem(["transfer-receive", id]),
      }),
    ),
  cancelTransfer: (id: number) =>
    unwrap(
      api.POST("/api/v1/admin/transfers/{transfer_id}/cancel", { params: { path: { transfer_id: id } } }),
    ),
  placePO: (id: number) =>
    unwrap(
      api.POST("/api/v1/admin/purchase-orders/{po_id}/place", {
        params: { path: { po_id: id } },
        headers: idem(["po-place", id]),
      }),
    ),
  receivePO: (id: number, v: V) =>
    unwrap(
      api.POST("/api/v1/admin/purchase-orders/{po_id}/receive", {
        params: { path: { po_id: id }, header: idem(["po-receive", id, v]) },
        body: v as S["GRNIn"],
      }),
    ),
  cancelPO: (id: number) =>
    unwrap(
      api.POST("/api/v1/admin/purchase-orders/{po_id}/cancel", {
        params: { path: { po_id: id } },
        headers: idem(["po-cancel", id]),
      }),
    ),
  startProduction: (id: number) =>
    unwrap(api.POST("/api/v1/admin/production-orders/{pro_id}/start", { params: { path: { pro_id: id } } })),
  completeProduction: (id: number, v: V) =>
    unwrap(
      api.POST("/api/v1/admin/production-orders/{pro_id}/complete", {
        params: { path: { pro_id: id } },
        headers: idem(["production-complete", id, v]),
        body: v as S["CompleteIn"],
      }),
    ),
  cancelProduction: (id: number) =>
    unwrap(api.POST("/api/v1/admin/production-orders/{pro_id}/cancel", { params: { path: { pro_id: id } } })),
};
