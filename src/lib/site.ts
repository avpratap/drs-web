/**
 * Public site origin (no trailing slash) for canonical URLs, metadataBase, JSON-LD and the
 * robots.txt sitemap line. Set NEXT_PUBLIC_SITE_URL in production (see .env.example);
 * locally it defaults to the dev server on port 3100.
 */
export const siteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3100").replace(/\/+$/, "");
