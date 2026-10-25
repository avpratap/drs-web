/**
 * Read (NOT verify) a JWT payload. Signature verification is the backend's job; the web app
 * only uses the claims for routing decisions, and every API call is re-checked upstream.
 */
export type AccessClaims = { sub?: string; role?: string; exp?: number; type?: string };

export function decodeJwt(token: string | undefined | null): AccessClaims | null {
  if (!token) return null;
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "="));
    const claims: unknown = JSON.parse(json);
    return claims && typeof claims === "object" ? (claims as AccessClaims) : null;
  } catch {
    return null;
  }
}

export function isAdminToken(token: string | undefined | null): boolean {
  return decodeJwt(token)?.role === "admin";
}

/** Storefront shoppers: retail customers and B2B subscribers. */
export const CUSTOMER_ROLES = ["customer", "subscriber"] as const;

export function isCustomerToken(token: string | undefined | null): boolean {
  const role = decodeJwt(token)?.role;
  return !!role && (CUSTOMER_ROLES as readonly string[]).includes(role);
}
