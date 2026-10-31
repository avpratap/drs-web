import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { apiBase } from "@/lib/env";
import { isAdminOnlyApi } from "@/lib/auth/bff";
import { isAdminToken } from "@/lib/auth/jwt";
import { ACCESS_COOKIE, forwardedFor, isSameOrigin } from "@/lib/auth/session";

/**
 * Same-origin BFF for the typed browser client: attaches the access token from the httpOnly
 * cookie and forwards to the FastAPI backend. Token issuance/rotation endpoints are not
 * reachable through here — they go through /api/auth/* so tokens never touch JS. Admin-only
 * API paths (lib/auth/bff) need an admin token here too, so a customer session can never
 * reach them through the storefront's origin even if a backend check regressed.
 */
const BLOCKED = /^api\/v1\/auth\/(otp|refresh|logout)(\/|$)/;
const PASS_REQ_HEADERS = ["content-type", "accept", "idempotency-key", "if-none-match"];
const PASS_RES_HEADERS = [
  "content-type",
  "content-disposition",
  "etag",
  "cache-control",
  "x-total-count",
  "x-export-truncated",
];

async function handle(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const path = (await ctx.params).path.map(encodeURIComponent).join("/");
  if (!path.startsWith("api/v1/") || BLOCKED.test(path)) {
    return NextResponse.json({ detail: "Not found" }, { status: 404 });
  }
  if (!isSameOrigin(req)) return NextResponse.json({ detail: "Bad origin" }, { status: 403 });

  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  if (isAdminOnlyApi(req.method, path) && !isAdminToken(token))
    return NextResponse.json({ detail: "Not enough permissions" }, { status: 403 });

  const headers = new Headers(forwardedFor(req));
  for (const h of PASS_REQ_HEADERS) {
    const v = req.headers.get(h);
    if (v) headers.set(h, v);
  }
  headers.set("authorization", `Bearer ${token}`);

  const search = new URL(req.url).search;
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  let upstream: Response;
  try {
    upstream = await fetch(`${apiBase()}/${path}${search}`, {
      method: req.method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    return NextResponse.json({ detail: "Backend unreachable" }, { status: 502 });
  }

  const resHeaders = new Headers();
  for (const h of PASS_RES_HEADERS) {
    const v = upstream.headers.get(h);
    if (v) resHeaders.set(h, v);
  }
  const body = upstream.status === 204 || upstream.status === 304 ? null : upstream.body;
  return new NextResponse(body, { status: upstream.status, headers: resHeaders });
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };
