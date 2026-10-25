import type { MetadataRoute } from "next";

/** Crawl the storefront; keep the admin console and API routes out of search. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/account", "/checkout"] }],
  };
}
