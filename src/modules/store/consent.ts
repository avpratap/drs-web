/**
 * Storefront cookie consent (DPDP Act notice). Today the site only sets essential cookies
 * (the session, kept httpOnly); the stored choice is what any future analytics or marketing
 * script must check before loading. Per-purpose consents for signed-in customers live on
 * /account/privacy (POST /account/consents).
 */
export const CONSENT_COOKIE = "drs_consent";
export type CookieChoice = "all" | "essential";
const YEAR = 365 * 24 * 60 * 60;

export function readConsent(cookie: string): CookieChoice | null {
  const v = cookie
    .split(";")
    .map((c) => c.trim().split("="))
    .find(([k]) => k === CONSENT_COOKIE)?.[1];
  return v === "all" || v === "essential" ? v : null;
}

export function consentCookie(choice: CookieChoice, secure: boolean): string {
  return `${CONSENT_COOKIE}=${choice}; Path=/; Max-Age=${YEAR}; SameSite=Lax${secure ? "; Secure" : ""}`;
}
