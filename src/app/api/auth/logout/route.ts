import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { serverApi } from "@/lib/api/server";
import { REFRESH_COOKIE, clearSession, isSameOrigin } from "@/lib/auth/session";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ detail: "Bad origin" }, { status: 403 });
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
}
