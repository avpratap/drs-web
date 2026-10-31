/**
 * Backend API paths only an admin may call through the BFF (defense in depth: the backend
 * re-checks every role). `path` is relative to the API origin, e.g. "api/v1/admin/orders".
 * - every route with an `admin` segment (/admin/**, /billing/admin/topup, …);
 * - catalogue writes (products and variants), except customers' own ratings/reviews.
 */
export function isAdminOnlyApi(method: string, path: string): boolean {
  const segments = path.split("?")[0].split("/").filter(Boolean);
  if (segments.includes("admin")) return true;
  const write = !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
  return write && segments[2] === "products" && !segments.includes("ratings");
}
