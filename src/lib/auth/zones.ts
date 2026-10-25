/**
 * Route zones (used by the proxy):
 * - admin: /admin/** except /admin/login → admin token, else /admin/login?next=
 * - customer: account, checkout, orders, subscriptions, wallet (except /account/login)
 *   → customer|subscriber token, else /account/login?next=
 * - public: everything else (storefront home, catalogue, cart, CMS pages).
 */
export type Zone = "admin" | "admin-login" | "customer" | "customer-login" | "public";

export const ADMIN_LOGIN_PATH = "/admin/login";
export const CUSTOMER_LOGIN_PATH = "/account/login";
const CUSTOMER_PREFIXES = ["/account", "/checkout", "/orders", "/subscriptions", "/wallet"];

const under = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

export function zoneOf(pathname: string): Zone {
  if (under(pathname, ADMIN_LOGIN_PATH)) return "admin-login";
  if (under(pathname, "/admin")) return "admin";
  if (under(pathname, CUSTOMER_LOGIN_PATH)) return "customer-login";
  if (CUSTOMER_PREFIXES.some((p) => under(pathname, p))) return "customer";
  return "public";
}

/** A post-login `next` that stays inside the given zone (never off-site, never cross-zone). */
export function safeNext(
  next: string | null | undefined,
  zone: "admin" | "customer",
  fallback: string,
): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  const path = next.split(/[?#]/)[0];
  const z = zoneOf(path);
  if (zone === "admin") return z === "admin" ? next : fallback;
  return z === "admin" || z === "admin-login" || z === "customer-login" ? fallback : next;
}
