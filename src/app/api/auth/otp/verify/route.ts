import { NextResponse } from "next/server";
import { toHttpError } from "@/lib/api/errors";
import { serverApi } from "@/lib/api/server";
import { isAdminToken } from "@/lib/auth/jwt";
import { forwardedFor, isSameOrigin, setSession } from "@/lib/auth/session";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ detail: "Bad origin" }, { status: 403 });
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
  if (!isAdminToken(data.access_token)) {
    // Not an admin: revoke the session we just minted rather than leave it dangling.
    await api.POST("/api/v1/auth/logout", { body: { refresh_token: data.refresh_token } });
    return NextResponse.json({ detail: "This dashboard is for DRS admins only." }, { status: 403 });
  }
  const res = NextResponse.json({ ok: true });
  setSession(res, data);
  return res;
}
