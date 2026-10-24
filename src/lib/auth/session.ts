import "server-only";
import type { NextResponse } from "next/server";

export const ACCESS_COOKIE = "drs_at";
export const REFRESH_COOKIE = "drs_rt";
/** Refresh cookie is only sent to the auth route handlers, never to pages or the data proxy. */
export const REFRESH_PATH = "/api/auth";
/** Matches backend REFRESH_TOKEN_DAYS; the access cookie lives as long so its role claim can gate pages. */
const SESSION_MAX_AGE = 14 * 24 * 60 * 60;

const base = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: SESSION_MAX_AGE,
} as const;

export function setSession(res: NextResponse, pair: { access_token: string; refresh_token: string }) {
  res.cookies.set(ACCESS_COOKIE, pair.access_token, { ...base, sameSite: "lax", path: "/" });
  res.cookies.set(REFRESH_COOKIE, pair.refresh_token, {
    ...base,
    sameSite: "strict",
    path: REFRESH_PATH,
  });
}

export function clearSession(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, "", { ...base, sameSite: "lax", path: "/", maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { ...base, sameSite: "strict", path: REFRESH_PATH, maxAge: 0 });
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
