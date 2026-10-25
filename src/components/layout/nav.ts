export type NavItem = { href: string; label: string };
export type NavGroup = { label: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  { label: "", items: [{ href: "/", label: "Overview" }] },
  {
    label: "Catalog",
    items: [
      { href: "/products", label: "Products" },
      { href: "/price-tiers", label: "Price tiers" },
      { href: "/product-prices", label: "Product prices" },
    ],
  },
  {
    label: "Billing",
    items: [
      { href: "/accounts", label: "Accounts & wallets" },
      { href: "/withdrawals", label: "Withdrawals" },
      { href: "/payments", label: "Payments" },
      { href: "/refunds", label: "Refunds" },
    ],
  },
  {
    label: "Inventory",
    items: [
      { href: "/stock", label: "Stock" },
      { href: "/batches", label: "Batches (FEFO)" },
      { href: "/locations", label: "Locations" },
      { href: "/transfers", label: "Transfers" },
      { href: "/suppliers", label: "Suppliers" },
      { href: "/purchase-orders", label: "Purchase orders" },
      { href: "/boms", label: "Bills of materials" },
      { href: "/production-orders", label: "Production" },
    ],
  },
  {
    label: "Delivery",
    items: [
      { href: "/delivery", label: "Daily deliveries" },
      { href: "/cutoff", label: "Cutoff runs" },
      { href: "/delivery-assignments", label: "Driver assignments" },
      { href: "/orders", label: "Orders" },
      { href: "/returns", label: "Returns (RMA)" },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/reports", label: "Reports" },
      { href: "/audit-log", label: "Audit log" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/banners", label: "Banners" },
      { href: "/articles", label: "Articles" },
      { href: "/pages", label: "Pages" },
      { href: "/newsletter", label: "Newsletter" },
    ],
  },
  {
    label: "Customers",
    items: [
      { href: "/subscriptions", label: "Subscriptions" },
      { href: "/shops", label: "Shops" },
      { href: "/tickets", label: "Support tickets" },
      { href: "/ratings", label: "Ratings" },
      { href: "/coupons", label: "Coupons" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/users", label: "Users & staff" },
      { href: "/feature-flags", label: "Feature flags" },
    ],
  },
];

export const NAV = NAV_GROUPS.flatMap((g) => g.items);

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
