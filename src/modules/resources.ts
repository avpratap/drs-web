import type { ResourceProps } from "@refinedev/core";

const crud = (
  name: string,
  base: string,
  label: string,
  opts: { create?: boolean; edit?: boolean; show?: boolean } = {},
): ResourceProps => ({
  name,
  list: base,
  ...(opts.create ? { create: `${base}/create` } : {}),
  ...(opts.edit ? { edit: `${base}/:id/edit` } : {}),
  ...(opts.show ? { show: `${base}/:id` } : {}),
  meta: { label },
});

/** Refine resource → route map (drives redirects after create/edit and breadcrumbs). */
export const resources: ResourceProps[] = [
  crud("products", "/products", "Products", { create: true, edit: true, show: true }),
  {
    name: "variants",
    list: "/products/:productId",
    create: "/products/:productId/variants/create",
    edit: "/products/:productId/variants/:id/edit",
    meta: { label: "Variants", parent: "products", hide: true },
  },
  crud("price-tiers", "/price-tiers", "Price tiers", { create: true, edit: true, show: true }),
  crud("product-prices", "/product-prices", "Product prices", { create: true, edit: true, show: true }),
  crud("accounts", "/accounts", "Accounts", { show: true }),
  crud("withdrawals", "/withdrawals", "Withdrawals"),
  crud("payments", "/payments", "Payments", { show: true }),
  crud("refunds", "/refunds", "Refunds", { show: true }),
  crud("stock", "/stock", "Stock"),
  crud("batches", "/batches", "Batches"),
  crud("locations", "/locations", "Locations", { create: true, edit: true }),
  crud("transfers", "/transfers", "Transfers", { create: true, show: true }),
  crud("suppliers", "/suppliers", "Suppliers", { create: true }),
  crud("purchase-orders", "/purchase-orders", "Purchase orders", { create: true, show: true }),
  crud("boms", "/boms", "Bills of materials", { create: true, show: true }),
  crud("production-orders", "/production-orders", "Production", { create: true, show: true }),
  crud("delivery-orders", "/delivery", "Deliveries", { show: true }),
  crud("orders", "/orders", "Orders", { show: true }),
  crud("banners", "/banners", "Banners", { create: true, edit: true }),
  crud("articles", "/articles", "Articles", { create: true, edit: true }),
  crud("pages", "/pages", "Pages", { create: true, edit: true }),
  crud("newsletter", "/newsletter", "Newsletter"),
  crud("tickets", "/tickets", "Support tickets", { show: true }),
  crud("ratings", "/ratings", "Ratings"),
  crud("coupons", "/coupons", "Coupons", { create: true, edit: true, show: true }),
  crud("audit-log", "/audit-log", "Audit log"),
  crud("feature-flags", "/feature-flags", "Feature flags"),
];
