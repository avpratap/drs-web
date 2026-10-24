import { NextResponse } from "next/server";
import { toHttpError } from "@/lib/api/errors";
import { serverApi } from "@/lib/api/server";
import { forwardedFor, isSameOrigin } from "@/lib/auth/session";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ detail: "Bad origin" }, { status: 403 });
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
}
