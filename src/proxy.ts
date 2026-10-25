import { NextResponse, type NextRequest } from "next/server";
import { isAdminToken, isCustomerToken } from "@/lib/auth/jwt";
import { ADMIN_LOGIN_PATH, CUSTOMER_LOGIN_PATH, zoneOf } from "@/lib/auth/zones";

const ACCESS_COOKIE = "drs_at";

function toLogin(req: NextRequest, loginPath: string, token: string | undefined, home: string) {
  const { pathname, search } = req.nextUrl;
  const url = new URL(loginPath, req.url);
  if (pathname !== home) url.searchParams.set("next", pathname + search);
  if (token) url.searchParams.set("error", "forbidden");
  return NextResponse.redirect(url);
}

/**
 * Route gate with three zones (see lib/auth/zones): public storefront, signed-in customer
 * pages, and the admin console. Roles are read from the (httpOnly) access cookie for routing
 * only — the backend enforces roles on every API call, and expired tokens are rotated by the
 * client on the first 401.
 */
export function proxy(req: NextRequest) {
  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  switch (zoneOf(req.nextUrl.pathname)) {
    case "admin-login":
      return token && isAdminToken(token)
        ? NextResponse.redirect(new URL("/admin", req.url))
        : NextResponse.next();
    case "admin":
      return token && isAdminToken(token)
        ? NextResponse.next()
        : toLogin(req, ADMIN_LOGIN_PATH, token, "/admin");
    case "customer-login":
      return token && isCustomerToken(token)
        ? NextResponse.redirect(new URL("/", req.url))
        : NextResponse.next();
    case "customer":
      return token && isCustomerToken(token)
        ? NextResponse.next()
        : toLogin(req, CUSTOMER_LOGIN_PATH, isAdminToken(token) ? undefined : token, "/account");
    default:
      return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|ico|webp)$).*)",
  ],
};
