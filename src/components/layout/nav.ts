/** Admin lives under /admin; the storefront owns the root. */
export const ADMIN_HOME = "/admin";
export const ADMIN_LOGIN = "/admin/login";

export type NavItem = { href: string; label: string };
export type NavGroup = { label: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  { label: "", items: [{ href: ADMIN_HOME, label: "Overview" }] },
  {
    label: "Catalog",
    items: [
      { href: "/admin/products", label: "Products" },
      { href: "/admin/price-tiers", label: "Price tiers" },
      { href: "/admin/product-prices", label: "Product prices" },
    ],
  },
  {
    label: "Billing",
    items: [
      { href: "/admin/accounts", label: "Accounts & wallets" },
      { href: "/admin/withdrawals", label: "Withdrawals" },
      { href: "/admin/payments", label: "Payments" },
      { href: "/admin/refunds", label: "Refunds" },
      { href: "/admin/invoices", label: "Invoices" },
    ],
  },
  {
    label: "Loyalty",
    items: [
      { href: "/admin/gift-cards", label: "Gift cards" },
      { href: "/admin/loyalty", label: "Loyalty points" },
    ],
  },
  {
    label: "Inventory",
    items: [
      { href: "/admin/stock", label: "Stock" },
      { href: "/admin/batches", label: "Batches (FEFO)" },
      { href: "/admin/locations", label: "Locations" },
      { href: "/admin/transfers", label: "Transfers" },
      { href: "/admin/suppliers", label: "Suppliers" },
      { href: "/admin/purchase-orders", label: "Purchase orders" },
      { href: "/admin/boms", label: "Bills of materials" },
      { href: "/admin/production-orders", label: "Production" },
    ],
  },
  {
    label: "Delivery",
    items: [
      { href: "/admin/delivery", label: "Daily deliveries" },
      { href: "/admin/cutoff", label: "Cutoff runs" },
      { href: "/admin/delivery-assignments", label: "Driver assignments" },
      { href: "/admin/orders", label: "Orders" },
      { href: "/admin/returns", label: "Returns (RMA)" },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/admin/reports", label: "Reports" },
      { href: "/admin/churn", label: "Churn risk" },
      { href: "/admin/forecast", label: "Demand forecast" },
      { href: "/admin/reorder-suggestions", label: "Reorder suggestions" },
      { href: "/admin/copilot", label: "AI copilot" },
      { href: "/admin/audit-log", label: "Audit log" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/banners", label: "Banners" },
      { href: "/admin/articles", label: "Articles" },
      { href: "/admin/pages", label: "Pages" },
      { href: "/admin/newsletter", label: "Newsletter" },
    ],
  },
  {
    label: "Customers",
    items: [
      { href: "/admin/subscriptions", label: "Subscriptions" },
      { href: "/admin/shops", label: "Shops" },
      { href: "/admin/tickets", label: "Support tickets" },
      { href: "/admin/ratings", label: "Ratings" },
      { href: "/admin/coupons", label: "Coupons" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/users", label: "Users & staff" },
      { href: "/admin/notifications", label: "Notifications" },
      { href: "/admin/webhooks", label: "Webhooks" },
      { href: "/admin/feature-flags", label: "Feature flags" },
    ],
  },
];

export const NAV = NAV_GROUPS.flatMap((g) => g.items);

export function isActive(pathname: string, href: string): boolean {
  return href === ADMIN_HOME ? pathname === ADMIN_HOME : pathname === href || pathname.startsWith(`${href}/`);
}
