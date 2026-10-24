import type { Pagination } from "@refinedev/core";

export const DEFAULT_PAGE_SIZE = 20;
const MAX_LIMIT = 200; // backend MAX_LIMIT

/** The backend has no total counts: ask for one extra row to know whether a next page exists. */
export function toLimitOffset(p?: Pagination) {
  const pageSize = Math.min(p?.pageSize ?? DEFAULT_PAGE_SIZE, MAX_LIMIT - 1);
  const page = Math.max(p?.currentPage ?? 1, 1);
  return { limit: pageSize + 1, offset: (page - 1) * pageSize, pageSize };
}

/** Trim the probe row and report a `total` that lets Refine enable "next" when more exist. */
export function pageResult<T>(rows: T[], offset: number, pageSize: number) {
  return { data: rows.slice(0, pageSize), total: offset + rows.length };
}
