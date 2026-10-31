import { api } from "@/lib/api/browser";
import type { components } from "@/lib/api/client";
import {
  filterNumber,
  filterValue,
  fullList,
  num,
  pagedList,
  requireMeta,
  findById,
  unwrap,
  type Handlers,
} from "@/lib/api/resource";

type S = components["schemas"];

export const catalogHandlers: Handlers = {
  products: {
    // Admin list: includes retired products (status filter) and reports a total.
    list: ({ pagination, filters }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/products", {
          params: {
            query: {
              ...page,
              q: filterValue(filters, "q"),
              category: filterValue(filters, "category"),
              status: (filterValue(filters, "status") ?? "all") as "all" | "active" | "retired",
            },
          },
        }),
      ),
    // The public read 404s retired products, which admins still open and edit. There's no
    // admin GET-by-id yet, so a 404 falls back to the admin list (retired only).
    async one(id) {
      const r = await api.GET("/api/v1/products/{product_id}", { params: { path: { product_id: num(id) } } });
      if (r.response.status !== 404) return unwrap(Promise.resolve(r));
      return findById(
        (q) => api.GET("/api/v1/admin/products", { params: { query: { ...q, status: "retired" } } }),
        num(id),
        "Product",
      );
    },
    create: (v) => unwrap(api.POST("/api/v1/products", { body: v as S["ProductCreate"] })),
    update: (id, v) =>
      unwrap(
        api.PATCH("/api/v1/products/{product_id}", {
          params: { path: { product_id: num(id) } },
          body: v as S["ProductUpdate"],
        }),
      ),
    async remove(id) {
      await unwrap(
        api.DELETE("/api/v1/products/{product_id}", { params: { path: { product_id: num(id) } } }),
      );
    },
  },

  variants: {
    list: ({ filters, meta }) =>
      fullList(
        api.GET("/api/v1/products/{product_id}/variants", {
          params: {
            path: {
              product_id: requireMeta(
                { productId: meta?.productId ?? filterNumber(filters, "product_id") },
                "productId",
                "A product",
              ),
            },
            query: { all: true },
          },
        }),
      ),
    one: (id) =>
      unwrap(
        api.GET("/api/v1/products/variants/{variant_id}", { params: { path: { variant_id: num(id) } } }),
      ),
    create: (v, meta) =>
      unwrap(
        api.POST("/api/v1/products/{product_id}/variants", {
          params: { path: { product_id: requireMeta(meta, "productId", "A product") } },
          body: v as S["VariantIn"],
        }),
      ),
    update: (id, v) =>
      unwrap(
        api.PATCH("/api/v1/products/variants/{variant_id}", {
          params: { path: { variant_id: num(id) } },
          body: v as S["VariantUpdate"],
        }),
      ),
    async remove(id) {
      await unwrap(
        api.DELETE("/api/v1/products/variants/{variant_id}", { params: { path: { variant_id: num(id) } } }),
      );
    },
  },

  "price-tiers": {
    list: () => fullList(api.GET("/api/v1/admin/price-tiers")),
    one: (id) =>
      unwrap(api.GET("/api/v1/admin/price-tiers/{tier_id}", { params: { path: { tier_id: num(id) } } })),
    create: (v) => unwrap(api.POST("/api/v1/admin/price-tiers", { body: v as S["PriceTierIn"] })),
    update: (id, v) =>
      unwrap(
        api.PATCH("/api/v1/admin/price-tiers/{tier_id}", {
          params: { path: { tier_id: num(id) } },
          body: v as S["PriceTierPatch"],
        }),
      ),
    async remove(id) {
      await unwrap(
        api.DELETE("/api/v1/admin/price-tiers/{tier_id}", { params: { path: { tier_id: num(id) } } }),
      );
    },
  },

  "product-prices": {
    list: ({ pagination, filters }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/product-prices", {
          params: { query: { ...page, product_id: filterNumber(filters, "product_id") } },
        }),
      ),
    one: (id) =>
      unwrap(api.GET("/api/v1/admin/product-prices/{price_id}", { params: { path: { price_id: num(id) } } })),
    create: (v) => unwrap(api.POST("/api/v1/admin/product-prices", { body: v as S["ProductPriceIn"] })),
    update: (id, v) =>
      unwrap(
        api.PATCH("/api/v1/admin/product-prices/{price_id}", {
          params: { path: { price_id: num(id) } },
          body: v as S["ProductPricePatch"],
        }),
      ),
    async remove(id) {
      await unwrap(
        api.DELETE("/api/v1/admin/product-prices/{price_id}", { params: { path: { price_id: num(id) } } }),
      );
    },
  },
};
