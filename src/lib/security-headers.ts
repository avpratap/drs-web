/**
 * Response security headers for every route (wired in next.config.ts).
 *
 * CSP: same-origin by default, plus the backend origin (product photos, CMS images and
 * signed invoice PDFs come from its media store), Razorpay Checkout and Google Fonts.
 * Scripts keep 'unsafe-inline' because Next inlines its bootstrap scripts into statically
 * prerendered pages (nonces would force every page to render per request); everything else
 * is locked down. `extraImgHosts` lets CMS images from another https host through
 * (CSP_IMG_HOSTS, space-separated).
 */
export function contentSecurityPolicy({
  apiBase,
  dev = false,
  extraImgHosts = [],
}: {
  apiBase?: string;
  dev?: boolean;
  extraImgHosts?: string[];
}): string {
  let api = "";
  try {
    api = apiBase ? new URL(apiBase).origin : "";
  } catch {
    api = "";
  }
  const razorpay = ["https://checkout.razorpay.com", "https://api.razorpay.com"];
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      ...(dev ? ["'unsafe-eval'"] : []),
      "https://checkout.razorpay.com",
    ],
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
    "img-src": ["'self'", "data:", "blob:", api, "https://cdn.razorpay.com", ...extraImgHosts],
    "connect-src": [
      "'self'",
      api,
      "https://api.razorpay.com",
      "https://lumberjack.razorpay.com",
      ...(dev ? ["ws:", "wss:"] : []),
    ],
    "frame-src": ["'self'", api, ...razorpay],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'", "https://api.razorpay.com"],
    "frame-ancestors": ["'none'"],
  };
  return Object.entries(directives)
    .map(([k, v]) => [k, ...new Set(v.filter(Boolean))].join(" "))
    .join("; ");
}

export function securityHeaders(env: {
  apiBase?: string;
  production: boolean;
  extraImgHosts?: string[];
}): { key: string; value: string }[] {
  return [
    {
      key: "Content-Security-Policy",
      value: contentSecurityPolicy({
        apiBase: env.apiBase,
        dev: !env.production,
        extraImgHosts: env.extraImgHosts,
      }),
    },
    // Two years, all subdomains (browsers ignore it on plain-http localhost).
    ...(env.production
      ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
      : []),
    {
      key: "Permissions-Policy",
      value: [
        "camera=()",
        "microphone=()",
        "geolocation=()",
        "usb=()",
        "browsing-topics=()",
        'payment=(self "https://checkout.razorpay.com" "https://api.razorpay.com")',
      ].join(", "),
    },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  ];
}
