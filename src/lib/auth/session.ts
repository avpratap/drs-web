import "server-only";
import type { NextResponse } from "next/server";

export const ACCESS_COOKIE = "drs_at";
export const REFRESH_COOKIE = "drs_rt";
/**
 * The refresh cookie is only sent to its zone's auth route handlers, never to pages or the
 * data proxy: admin sessions refresh under /api/auth, customer sessions under /api/store-auth.
 */
export const REFRESH_PATH = "/api/auth";
export const STORE_REFRESH_PATH = "/api/store-auth";
/** Matches backend REFRESH_TOKEN_DAYS; the access cookie lives as long so its role claim can gate pages. */
const SESSION_MAX_AGE = 14 * 24 * 60 * 60;

type CookieOpts = { path: string; sameSite: "Lax" | "Strict"; maxAge: number };

/**
 * Set-Cookie headers are appended directly: `res.cookies` keys cookies by name, so two
 * `drs_rt` cookies on different paths (one per zone) would collapse into the last one.
 */
function appendCookie(res: NextResponse, name: string, value: string, o: CookieOpts) {
  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${o.path}`, `Max-Age=${o.maxAge}`];
  if (o.maxAge === 0) parts.push("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  parts.push("HttpOnly", `SameSite=${o.sameSite}`);
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  res.headers.append("Set-Cookie", parts.join("; "));
}

const ZONE_PATHS = [REFRESH_PATH, STORE_REFRESH_PATH];

/** Start a session in one zone; any other zone's refresh cookie is dropped (one session at a time). */
export function setSession(
  res: NextResponse,
  pair: { access_token: string; refresh_token: string },
  refreshPath: string = REFRESH_PATH,
) {
  appendCookie(res, ACCESS_COOKIE, pair.access_token, {
    path: "/",
    sameSite: "Lax",
    maxAge: SESSION_MAX_AGE,
  });
  appendCookie(res, REFRESH_COOKIE, pair.refresh_token, {
    path: refreshPath,
    sameSite: "Strict",
    maxAge: SESSION_MAX_AGE,
  });
  for (const path of ZONE_PATHS.filter((p) => p !== refreshPath))
    appendCookie(res, REFRESH_COOKIE, "", { path, sameSite: "Strict", maxAge: 0 });
}

/** Signing out of either zone clears the access cookie and both refresh cookies. */
export function clearSession(res: NextResponse) {
  appendCookie(res, ACCESS_COOKIE, "", { path: "/", sameSite: "Lax", maxAge: 0 });
  for (const path of ZONE_PATHS)
    appendCookie(res, REFRESH_COOKIE, "", { path, sameSite: "Strict", maxAge: 0 });
}

/** CSRF defence for cookie-authenticated mutations: require a same-origin Origin header. */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return req.method === "GET" || req.method === "HEAD";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Forward the caller IP so backend OTP rate limits are per client, not per Vercel edge. */
export function forwardedFor(req: Request): Record<string, string> {
  const xff = req.headers.get("x-forwarded-for");
  return xff ? { "X-Forwarded-For": xff } : {};
}
