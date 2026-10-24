import "server-only";
import { apiBase } from "@/lib/env";
import { createApiClient } from "./client";

/** Typed client that talks straight to the FastAPI backend (server side only). */
export function serverApi(accessToken?: string) {
  return createApiClient({ baseUrl: apiBase(), accessToken });
}
