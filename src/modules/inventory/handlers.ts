import { api } from "@/lib/api/browser";
import type { components } from "@/lib/api/client";
import {
  filterBool,
  filterNumber,
  filterValue,
  idem,
  findById,
  num,
  pagedList,
  requireMeta,
  unwrap,
  type Handlers,
} from "@/lib/api/resource";

type S = components["schemas"];

export const inventoryHandlers: Handlers = {
  locations: {
    list: ({ pagination }) =>
      pagedList(pagination, (page) => api.GET("/api/v1/admin/locations", { params: { query: page } })),
    // No GET-by-id endpoint: walk the list's pages until the id turns up.
    one: (id) =>
      findById((q) => api.GET("/api/v1/admin/locations", { params: { query: q } }), num(id), "Location"),
    create: (v) =>
      unwrap(api.POST("/api/v1/admin/locations", { body: v as S["app__api__v1__inventory__LocationIn"] })),
    update: (id, v) =>
      unwrap(
        api.PATCH("/api/v1/admin/locations/{location_id}", {
          params: { path: { location_id: num(id) } },
          body: v as S["LocationPatch"],
        }),
      ),
  },
  stock: {
    list: ({ pagination, filters }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/stock", {
          params: {
            query: {
              ...page,
              location_id: filterNumber(filters, "location_id"),
              product_id: filterNumber(filters, "product_id"),
            },
          },
        }),
      ),
  },
  "stock-low": {
    list: ({ pagination }) =>
      pagedList(pagination, (page) => api.GET("/api/v1/admin/stock/low", { params: { query: page } })),
  },
  "reorder-suggestions": {
    list: ({ pagination }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/stock/reorder-suggestions", { params: { query: page } }),
      ),
  },
  "stock-movements": {
    list: ({ pagination, meta }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/stock/{product_id}/movements", {
          params: { path: { product_id: requireMeta(meta, "productId", "A product") }, query: page },
        }),
      ),
  },
  batches: {
    list: ({ pagination, filters }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/stock/batches", {
          params: {
            query: {
              ...page,
              product_id: filterNumber(filters, "product_id"),
              location_id: filterNumber(filters, "location_id"),
              expiring_before: filterValue(filters, "expiring_before"),
              active_only: filterBool(filters, "active_only") ?? true,
            },
          },
        }),
      ),
    create: (v) =>
      unwrap(
        api.POST("/api/v1/admin/stock/batches", { params: { header: idem() }, body: v as S["BatchIn"] }),
      ),
  },
  transfers: {
    list: ({ pagination, filters }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/transfers", {
          params: { query: { ...page, status_filter: filterValue(filters, "status") } },
        }),
      ),
    one: (id) =>
      unwrap(
        api.GET("/api/v1/admin/transfers/{transfer_id}", { params: { path: { transfer_id: num(id) } } }),
      ),
    create: (v) => unwrap(api.POST("/api/v1/admin/transfers", { body: v as S["TransferIn"] })),
  },
  suppliers: {
    list: ({ pagination }) =>
      pagedList(pagination, (page) => api.GET("/api/v1/admin/suppliers", { params: { query: page } })),
    create: (v) => unwrap(api.POST("/api/v1/admin/suppliers", { body: v as S["SupplierIn"] })),
  },
  "purchase-orders": {
    list: ({ pagination, filters }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/purchase-orders", {
          params: { query: { ...page, status_filter: filterValue(filters, "status") } },
        }),
      ),
    one: (id) =>
      unwrap(api.GET("/api/v1/admin/purchase-orders/{po_id}", { params: { path: { po_id: num(id) } } })),
    create: (v) => unwrap(api.POST("/api/v1/admin/purchase-orders", { body: v as S["POIn"] })),
  },
  boms: {
    list: ({ pagination, filters }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/boms", {
          params: { query: { ...page, product_id: filterNumber(filters, "product_id") } },
        }),
      ),
    one: (id) => unwrap(api.GET("/api/v1/admin/boms/{bom_id}", { params: { path: { bom_id: num(id) } } })),
    create: (v) => unwrap(api.POST("/api/v1/admin/boms", { body: v as S["BomIn"] })),
  },
  "production-orders": {
    list: ({ pagination, filters }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/production-orders", {
          params: { query: { ...page, status_filter: filterValue(filters, "status") } },
        }),
      ),
    one: (id) =>
      unwrap(api.GET("/api/v1/admin/production-orders/{pro_id}", { params: { path: { pro_id: num(id) } } })),
    create: (v) => unwrap(api.POST("/api/v1/admin/production-orders", { body: v as S["ProductionIn"] })),
  },
};
