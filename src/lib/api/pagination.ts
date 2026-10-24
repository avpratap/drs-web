import type { Pagination } from "@refinedev/core";

export const DEFAULT_PAGE_SIZE = 20;
const MAX_LIMIT = 200; // backend MAX_LIMIT
export const TOTAL_HEADER = "x-total-count";

export function toLimitOffset(p?: Pagination) {
  if (p?.mode === "off") return { limit: MAX_LIMIT, offset: 0, pageSize: MAX_LIMIT };
  const pageSize = Math.min(p?.pageSize ?? DEFAULT_PAGE_SIZE, MAX_LIMIT);
  const page = Math.max(p?.currentPage ?? 1, 1);
  return { limit: pageSize, offset: (page - 1) * pageSize, pageSize };
}

/**
 * Total rows for a page. Admin lists send `X-Total-Count`; for endpoints that don't,
 * a full page implies there may be more, so report one extra to keep "next" enabled.
 */
export function totalFrom(
  headers: Headers | undefined,
  rows: number,
  offset: number,
  pageSize: number,
): number {
  const raw = headers?.get(TOTAL_HEADER);
  const n = raw == null ? NaN : Number(raw);
  if (Number.isFinite(n) && n >= 0) return n;
  return offset + rows + (rows >= pageSize ? 1 : 0);
}
