import type { BaseKey, BaseRecord, CrudFilter, GetListParams, HttpError } from "@refinedev/core";
import { toHttpError } from "./errors";
import { toLimitOffset, totalFrom } from "./pagination";

export type ApiResult<T> = { data?: T; error?: unknown; response: Response };
export type Meta = Record<string, unknown> | undefined;

/** One Refine resource mapped onto typed operations of the generated client. */
export type Handler = {
  list(p: GetListParams): Promise<{ data: BaseRecord[]; total: number }>;
  one?(id: BaseKey, meta?: Meta): Promise<BaseRecord>;
  create?(v: unknown, meta?: Meta): Promise<BaseRecord>;
  update?(id: BaseKey, v: unknown, meta?: Meta): Promise<BaseRecord>;
  remove?(id: BaseKey, meta?: Meta): Promise<void>;
};

export type Handlers = Record<string, Handler>;

/** Unwrap an openapi-fetch result or throw a Refine HttpError. */
export async function unwrap<T>(p: Promise<ApiResult<T>>): Promise<T> {
  let r: ApiResult<T>;
  try {
    r = await p;
  } catch {
    throw toHttpError(null, 0);
  }
  if (!r.response.ok) throw toHttpError(r.error, r.response.status);
  return r.data as T;
}

/**
 * Run a paginated list call. `call` receives `{limit, offset}` for the query string;
 * the total comes from the backend's X-Total-Count header.
 */
export async function pagedList<T extends BaseRecord>(
  pagination: GetListParams["pagination"],
  call: (q: { limit: number; offset: number }) => Promise<ApiResult<T[]>>,
): Promise<{ data: T[]; total: number }> {
  const { limit, offset, pageSize } = toLimitOffset(pagination);
  // Build the request first: argument errors (e.g. a missing id) must surface as-is,
  // only a failed fetch is a network error.
  const pending = call({ limit, offset });
  let r: ApiResult<T[]>;
  try {
    r = await pending;
  } catch {
    throw toHttpError(null, 0);
  }
  if (!r.response.ok) throw toHttpError(r.error, r.response.status);
  const rows = r.data ?? [];
  return { data: rows, total: totalFrom(r.response.headers, rows.length, offset, pageSize) };
}

/** Non-paginated list endpoints. */
export async function fullList<T extends BaseRecord>(p: Promise<ApiResult<T[]>>) {
  const rows = await unwrap(p);
  return { data: rows, total: rows.length };
}

export function filterValue(filters: CrudFilter[] | undefined, field: string): string | undefined {
  for (const f of filters ?? []) {
    if ("field" in f && f.field === field && f.value !== undefined && f.value !== null && f.value !== "") {
      return String(f.value);
    }
  }
  return undefined;
}

export const filterNumber = (filters: CrudFilter[] | undefined, field: string) => {
  const v = filterValue(filters, field);
  return v === undefined || Number.isNaN(Number(v)) ? undefined : Number(v);
};

export const filterBool = (filters: CrudFilter[] | undefined, field: string) => {
  const v = filterValue(filters, field);
  return v === undefined ? undefined : v === "true";
};

export const num = (id: BaseKey) => Number(id);

export function notFound(what: string): HttpError {
  return { message: `${what} not found`, statusCode: 404 };
}

/**
 * Find one row by id in a paged admin list, for resources with no GET-by-id endpoint. Walks
 * every page (`limit` rows each) until it's found or a short page ends the list — no cap at
 * the first page. `maxPages` only guards against a runaway list.
 */
export async function findById<T extends { id: number }>(
  fetchPage: (q: { limit: number; offset: number }) => Promise<ApiResult<T[]>>,
  id: number,
  what: string,
  { limit = 200, maxPages = 50 }: { limit?: number; maxPages?: number } = {},
): Promise<T> {
  for (let page = 0; page < maxPages; page++) {
    const rows = await unwrap(fetchPage({ limit, offset: page * limit }));
    const found = rows.find((r) => r.id === id);
    if (found) return found;
    if (rows.length < limit) break;
  }
  throw notFound(what);
}

export function requireMeta(meta: Meta, key: string, label: string): number {
  const v = meta?.[key];
  if (v === undefined || v === null || v === "")
    throw { message: `${label} is required`, statusCode: 400 } satisfies HttpError;
  return Number(v);
}

/** Header for endpoints guarded by `require_idempotency_key` (one key per user action). */
export function idem(): { "Idempotency-Key": string } {
  const key =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return { "Idempotency-Key": key };
}
