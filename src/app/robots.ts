import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * Crawl the storefront; keep the admin console, account and API routes out of search. Served
 * by the web app (it knows its own private zones); the sitemap itself is proxied from the
 * backend, which lists published articles and pages.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/account", "/checkout"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
