import { NextResponse, type NextRequest } from "next/server";
import { isAdminToken } from "@/lib/auth/jwt";

const ACCESS_COOKIE = "drs_at";

/**
 * Route gate: every page except /login requires an admin session. The role claim is read
 * from the (httpOnly) access cookie for routing only — the backend enforces role=admin on
 * every admin endpoint, and expired tokens are rotated by the client on the first 401.
 */
export function proxy(req: NextRequest) {
  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  const { pathname, search } = req.nextUrl;
  const isLogin = pathname === "/login";

  if (isLogin) {
    return token && isAdminToken(token) ? NextResponse.redirect(new URL("/", req.url)) : NextResponse.next();
  }
  if (!token || !isAdminToken(token)) {
    const url = new URL("/login", req.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    if (token) url.searchParams.set("error", "forbidden");
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico|webp)$).*)"],
};
