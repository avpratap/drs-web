import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Orders moved into the account area; old links (and PR 3's confirmation URL) keep working.
  async redirects() {
    return [
      { source: "/orders", destination: "/account/orders", permanent: true },
      { source: "/orders/:id", destination: "/account/orders/:id", permanent: true },
      // The backend sitemap still lists /blog and /shop: send them to the storefront's routes.
      { source: "/blog", destination: "/journal", permanent: true },
      { source: "/blog/:slug", destination: "/journal/:slug", permanent: true },
      { source: "/shop", destination: "/products", permanent: true },
    ];
  },
  // The sitemap is built by the backend (published articles and pages); serve it from the site root.
  async rewrites() {
    const api = (process.env.NEXT_PUBLIC_API_BASE ?? "").replace(/\/+$/, "");
    return api ? [{ source: "/sitemap.xml", destination: `${api}/sitemap.xml` }] : [];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders({
          apiBase: process.env.NEXT_PUBLIC_API_BASE,
          production: process.env.NODE_ENV === "production",
          extraImgHosts: (process.env.CSP_IMG_HOSTS ?? "").split(/\s+/).filter(Boolean),
        }),
      },
    ];
  },
};

export default nextConfig;
