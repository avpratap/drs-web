import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { serverApi } from "@/lib/api/server";
import { isAdminToken } from "@/lib/auth/jwt";
import { REFRESH_COOKIE, clearSession, isSameOrigin, setSession } from "@/lib/auth/session";

/** Rotate the refresh token (backend issues a new pair and revokes the old refresh token). */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ detail: "Bad origin" }, { status: 403 });
  const refresh = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (!refresh) {
    const res = NextResponse.json({ detail: "No session" }, { status: 401 });
    clearSession(res);
    return res;
  }
  const { data } = await serverApi().POST("/api/v1/auth/refresh", {
    body: { refresh_token: refresh },
  });
  if (!data || !isAdminToken(data.access_token)) {
    const res = NextResponse.json({ detail: "Session expired" }, { status: 401 });
    clearSession(res);
    return res;
  }
  const res = NextResponse.json({ ok: true });
  setSession(res, data);
  return res;
}
