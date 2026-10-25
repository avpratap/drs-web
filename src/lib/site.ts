/** Public site origin for canonical URLs, JSON-LD and robots (no trailing slash). */
export const siteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
