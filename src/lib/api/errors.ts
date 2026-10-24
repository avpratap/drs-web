import type { HttpError } from "@refinedev/core";

type FastApiValidationItem = { loc?: (string | number)[]; msg?: string };

/** Convert an openapi-fetch error body + status into a Refine `HttpError` (with field errors for 422s). */
export function toHttpError(body: unknown, status: number): HttpError {
  const detail = (body as { detail?: unknown } | null | undefined)?.detail;
  if (Array.isArray(detail)) {
    const errors: Record<string, string> = {};
    for (const item of detail as FastApiValidationItem[]) {
      const field = item.loc?.filter((p) => p !== "body" && p !== "query").join(".");
      if (field && item.msg && !errors[field]) errors[field] = item.msg;
    }
    return { message: "Please fix the highlighted fields.", statusCode: status, errors };
  }
  const message =
    typeof detail === "string" && detail
      ? detail
      : status === 0
        ? "Network error — is the API reachable?"
        : `Request failed (${status})`;
  return { message, statusCode: status };
}
