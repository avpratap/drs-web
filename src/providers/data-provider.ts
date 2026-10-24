import type { BaseKey, DataProvider, HttpError } from "@refinedev/core";
import type { Handler, Handlers, Meta } from "@/lib/api/resource";
import { handlers as registry } from "@/modules/registry";

function unsupported(resource: string, op: string): HttpError {
  return { message: `"${resource}" does not support ${op}`, statusCode: 405 };
}

/** Refine data provider over per-module handler maps (every call is a typed API call). */
export function createDataProvider(handlers: Handlers): DataProvider {
  const handler = (resource: string): Handler => {
    const h = handlers[resource];
    if (!h) throw { message: `Unknown resource "${resource}"`, statusCode: 400 } satisfies HttpError;
    return h;
  };
  const one = (resource: string, id: BaseKey, meta: Meta) => {
    const h = handler(resource);
    if (!h.one) throw unsupported(resource, "show");
    return h.one(id, meta);
  };
  return {
    getApiUrl: () => "/api/backend",
    getList: async (p) => (await handler(p.resource).list(p)) as never,
    getOne: async ({ resource, id, meta }) => ({ data: (await one(resource, id, meta)) as never }),
    getMany: async ({ resource, ids, meta }) => ({
      data: (await Promise.all(ids.map((id) => one(resource, id, meta)))) as never,
    }),
    create: async ({ resource, variables, meta }) => {
      const h = handler(resource);
      if (!h.create) throw unsupported(resource, "create");
      return { data: (await h.create(variables, meta)) as never };
    },
    update: async ({ resource, id, variables, meta }) => {
      const h = handler(resource);
      if (!h.update) throw unsupported(resource, "edit");
      return { data: (await h.update(id, variables, meta)) as never };
    },
    deleteOne: async ({ resource, id, meta }) => {
      const h = handler(resource);
      if (!h.remove) throw unsupported(resource, "delete");
      await h.remove(id, meta);
      return { data: { id } as never };
    },
  };
}

export const dataProvider = createDataProvider(registry);
