import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { toHttpError } from "@/lib/api/errors";
import { serverApi } from "@/lib/api/server";
import { REFRESH_COOKIE, clearSession, forwardedFor, isSameOrigin, setSession } from "./session";

/**
 * Route-handler factories shared by the two auth zones (admin: /api/auth, customer:
 * /api/store-auth). Each zone decides which roles may hold a session and which cookie path
 * its refresh token lives on; the cookies themselves are the same httpOnly pair.
 */
export type ZoneAuth = {
  /** Which access tokens this zone accepts. */
  allows: (accessToken: string) => boolean;
  /** Message when someone of another role verifies an OTP here. */
  denied: string;
  /** Path the refresh cookie is scoped to (the zone's route prefix). */
  refreshPath: string;
};

const badOrigin = () => NextResponse.json({ detail: "Bad origin" }, { status: 403 });

export function otpRequestHandler() {
  return async function POST(req: Request) {
    if (!isSameOrigin(req)) return badOrigin();
    const { phone } = (await req.json().catch(() => ({}))) as { phone?: string };
    const { data, error, response } = await serverApi().POST("/api/v1/auth/otp/request", {
      body: { phone: phone ?? "" },
      headers: forwardedFor(req),
    });
    if (error || !data) {
      const e = toHttpError(error, response.status);
      return NextResponse.json({ detail: e.message, errors: e.errors }, { status: response.status });
    }
    return NextResponse.json(data);
  };
}

export function otpVerifyHandler(zone: ZoneAuth) {
  return async function POST(req: Request) {
    if (!isSameOrigin(req)) return badOrigin();
    const { phone, otp } = (await req.json().catch(() => ({}))) as { phone?: string; otp?: string };
    const api = serverApi();
    const { data, error, response } = await api.POST("/api/v1/auth/otp/verify", {
      body: { phone: phone ?? "", otp: otp ?? "" },
      headers: forwardedFor(req),
    });
    if (error || !data) {
      const e = toHttpError(error, response.status);
      return NextResponse.json({ detail: e.message, errors: e.errors }, { status: response.status });
    }
    if (!zone.allows(data.access_token)) {
      // Wrong zone for this role: revoke the session we just minted rather than leave it dangling.
      await api.POST("/api/v1/auth/logout", { body: { refresh_token: data.refresh_token } });
      return NextResponse.json({ detail: zone.denied }, { status: 403 });
    }
    const res = NextResponse.json({ ok: true });
    setSession(res, data, zone.refreshPath);
    return res;
  };
}

/** Rotate the refresh token (backend issues a new pair and revokes the old refresh token). */
export function refreshHandler(zone: ZoneAuth) {
  return async function POST(req: Request) {
    if (!isSameOrigin(req)) return badOrigin();
    const refresh = (await cookies()).get(REFRESH_COOKIE)?.value;
    if (!refresh) {
      const res = NextResponse.json({ detail: "No session" }, { status: 401 });
      clearSession(res);
      return res;
    }
    const { data } = await serverApi().POST("/api/v1/auth/refresh", { body: { refresh_token: refresh } });
    if (!data || !zone.allows(data.access_token)) {
      const res = NextResponse.json({ detail: "Session expired" }, { status: 401 });
      clearSession(res);
      return res;
    }
    const res = NextResponse.json({ ok: true });
    setSession(res, data, zone.refreshPath);
    return res;
  };
}

export function logoutHandler() {
  return async function POST(req: Request) {
    if (!isSameOrigin(req)) return badOrigin();
    const refresh = (await cookies()).get(REFRESH_COOKIE)?.value;
    if (refresh) {
      // Best effort: revoke the whole refresh family upstream; cookies are cleared regardless.
      await serverApi()
        .POST("/api/v1/auth/logout", { body: { refresh_token: refresh } })
        .catch(() => undefined);
    }
    const res = NextResponse.json({ ok: true });
    clearSession(res);
    return res;
  };
}
