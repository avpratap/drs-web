import createClient, { type Client } from "openapi-fetch";
import type { paths } from "./schema";

export type ApiClient = Client<paths>;
export type { paths, components } from "./schema";

/**
 * Typed DRS API client generated from the backend OpenAPI spec.
 *
 * - On the server, `baseUrl` is `NEXT_PUBLIC_API_BASE` and an access token may be passed.
 * - In the browser, `baseUrl` is the same-origin BFF (`/api/backend`), which attaches the
 *   JWT from the httpOnly cookie and forwards to `NEXT_PUBLIC_API_BASE`.
 */
export function createApiClient(opts: {
  baseUrl: string;
  accessToken?: string;
  fetch?: typeof globalThis.fetch;
}): ApiClient {
  return createClient<paths>({
    baseUrl: opts.baseUrl,
    headers: opts.accessToken ? { Authorization: `Bearer ${opts.accessToken}` } : undefined,
    fetch: opts.fetch,
  });
}
