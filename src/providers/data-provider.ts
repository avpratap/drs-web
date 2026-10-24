import type {
  BaseKey,
  BaseRecord,
  CrudFilter,
  DataProvider,
  GetListParams,
  HttpError,
} from "@refinedev/core";
import { api } from "@/lib/api/browser";
import type { components } from "@/lib/api/client";
import { toHttpError } from "@/lib/api/errors";
import { pageResult, toLimitOffset } from "@/lib/api/pagination";

type S = components["schemas"];
type Result<T> = { data?: T; error?: unknown; response: Response };

/** Unwrap an openapi-fetch result or throw a Refine HttpError. */
async function unwrap<T>(p: Promise<Result<T>>): Promise<T> {
  let r: Result<T>;
  try {
    r = await p;
  } catch {
    throw toHttpError(null, 0);
  }
  if (!r.response.ok) throw toHttpError(r.error, r.response.status);
  return r.data as T;
}

function filterValue(filters: CrudFilter[] | undefined, field: string): string | undefined {
  for (const f of filters ?? []) {
    if ("field" in f && f.field === field && f.value !== undefined && f.value !== "") {
      return String(f.value);
    }
  }
  return undefined;
}

const num = (id: BaseKey) => Number(id);

function requireProductId(meta: Record<string, unknown> | undefined, filters?: CrudFilter[]) {
  const id = meta?.productId ?? filterValue(filters, "product_id");
  if (id === undefined || id === null || id === "") {
    throw { message: "A product is required", statusCode: 400 } satisfies HttpError;
  }
  return Number(id);
}

type Handler = {
  list(p: GetListParams): Promise<{ data: BaseRecord[]; total: number }>;
  one(id: BaseKey, meta?: Record<string, unknown>): Promise<BaseRecord>;
  create(v: unknown, meta?: Record<string, unknown>): Promise<BaseRecord>;
  update(id: BaseKey, v: unknown): Promise<BaseRecord>;
  remove(id: BaseKey): Promise<void>;
};

/** Every resource maps 1:1 onto typed operations of the generated client. */
export const handlers: Record<string, Handler> = {
  products: {
    async list({ pagination, filters }) {
      const { limit, offset, pageSize } = toLimitOffset(pagination);
      const rows = await unwrap(
        api.GET("/api/v1/products", {
          params: {
            query: {
              limit,
              offset,
              q: filterValue(filters, "q"),
              category: filterValue(filters, "category"),
            },
          },
        }),
      );
      return pageResult(rows, offset, pageSize);
    },
    one: (id) =>
      unwrap(api.GET("/api/v1/products/{product_id}", { params: { path: { product_id: num(id) } } })),
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
    async list({ filters, meta }) {
      const product_id = requireProductId(meta, filters);
      const rows = await unwrap(
        api.GET("/api/v1/products/{product_id}/variants", {
          params: { path: { product_id }, query: { all: true } },
        }),
      );
      return { data: rows, total: rows.length };
    },
    // No GET-by-id endpoint for variants: read the product's variant list and pick one.
    async one(id, meta) {
      const product_id = requireProductId(meta);
      const rows = await unwrap(
        api.GET("/api/v1/products/{product_id}/variants", {
          params: { path: { product_id }, query: { all: true } },
        }),
      );
      const found = rows.find((r) => r.id === num(id));
      if (!found) throw { message: "Variant not found", statusCode: 404 } satisfies HttpError;
      return found;
    },
    create: (v, meta) =>
      unwrap(
        api.POST("/api/v1/products/{product_id}/variants", {
          params: { path: { product_id: requireProductId(meta) } },
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
        api.DELETE("/api/v1/products/variants/{variant_id}", {
          params: { path: { variant_id: num(id) } },
        }),
      );
    },
  },

  "price-tiers": {
    async list() {
      const rows = await unwrap(api.GET("/api/v1/admin/price-tiers"));
      return { data: rows, total: rows.length };
    },
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
    async list({ pagination, filters }) {
      const { limit, offset, pageSize } = toLimitOffset(pagination);
      const pid = filterValue(filters, "product_id");
      const rows = await unwrap(
        api.GET("/api/v1/admin/product-prices", {
          params: { query: { limit, offset, product_id: pid ? Number(pid) : undefined } },
        }),
      );
      return pageResult(rows, offset, pageSize);
    },
    one: (id) =>
      unwrap(
        api.GET("/api/v1/admin/product-prices/{price_id}", {
          params: { path: { price_id: num(id) } },
        }),
      ),
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
        api.DELETE("/api/v1/admin/product-prices/{price_id}", {
          params: { path: { price_id: num(id) } },
        }),
      );
    },
  },
};

function handler(resource: string): Handler {
  const h = handlers[resource];
  if (!h) throw { message: `Unknown resource "${resource}"`, statusCode: 400 } satisfies HttpError;
  return h;
}

export const dataProvider: DataProvider = {
  getApiUrl: () => "/api/backend",
  getList: async (p) => {
    const r = await handler(p.resource).list(p);
    return r as never;
  },
  getOne: async ({ resource, id, meta }) => ({ data: (await handler(resource).one(id, meta)) as never }),
  getMany: async ({ resource, ids, meta }) => ({
    data: (await Promise.all(ids.map((id) => handler(resource).one(id, meta)))) as never,
  }),
  create: async ({ resource, variables, meta }) => ({
    data: (await handler(resource).create(variables, meta)) as never,
  }),
  update: async ({ resource, id, variables }) => ({
    data: (await handler(resource).update(id, variables)) as never,
  }),
  deleteOne: async ({ resource, id }) => {
    await handler(resource).remove(id);
    return { data: { id } as never };
  },
};
