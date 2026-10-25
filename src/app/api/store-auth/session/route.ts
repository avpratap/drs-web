import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isCustomerToken } from "@/lib/auth/jwt";
import { ACCESS_COOKIE } from "@/lib/auth/session";

/**
 * Whether this browser holds a customer session — always 200, so the storefront can decide
 * to load the cart without logging a 401 for every signed-out visitor.
 */
export async function GET() {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  return NextResponse.json(
    { customer: isCustomerToken(token) },
    { headers: { "cache-control": "no-store" } },
  );
}
