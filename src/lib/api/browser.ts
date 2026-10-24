import { createApiClient } from "./client";

export const BFF_BASE = "/api/backend";

let refreshing: Promise<boolean> | null = null;

/**
 * Rotate the refresh token once, no matter how many requests got a 401 at the same time.
 * The backend treats reuse of a rotated refresh token as theft and revokes the whole
 * session family, so concurrent refreshes must collapse into a single call.
 */
export function refreshSession(fetchImpl: typeof fetch = fetch): Promise<boolean> {
  refreshing ??= fetchImpl("/api/auth/refresh", { method: "POST", credentials: "same-origin" })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/** `fetch` that retries a request once after a successful token refresh. */
export function createRefreshingFetch(fetchImpl: typeof fetch = fetch): typeof fetch {
  return async (input, init) => {
    const request = new Request(input, { credentials: "same-origin", ...init });
    const retry = request.clone();
    const res = await fetchImpl(request);
    if (res.status !== 401) return res;
    const ok = await refreshSession(fetchImpl);
    return ok ? fetchImpl(retry) : res;
  };
}

/** Typed client for browser code. All data flows through here. */
export const api = createApiClient({
  baseUrl: BFF_BASE,
  fetch: (input, init) => createRefreshingFetch(globalThis.fetch.bind(globalThis))(input, init),
});
