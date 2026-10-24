"use client";

import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/nextjs-router";
import { authProvider } from "./auth-provider";
import { dataProvider } from "./data-provider";
import { notificationProvider } from "./notification-provider";

export const resources = [
  {
    name: "products",
    list: "/products",
    create: "/products/create",
    edit: "/products/:id/edit",
    show: "/products/:id",
    meta: { label: "Products", canDelete: true },
  },
  {
    name: "variants",
    list: "/products/:productId",
    create: "/products/:productId/variants/create",
    edit: "/products/:productId/variants/:id/edit",
    meta: { label: "Variants", parent: "products", hide: true, canDelete: true },
  },
  {
    name: "price-tiers",
    list: "/price-tiers",
    create: "/price-tiers/create",
    edit: "/price-tiers/:id/edit",
    show: "/price-tiers/:id",
    meta: { label: "Price tiers", canDelete: true },
  },
  {
    name: "product-prices",
    list: "/product-prices",
    create: "/product-prices/create",
    edit: "/product-prices/:id/edit",
    show: "/product-prices/:id",
    meta: { label: "Product prices", canDelete: true },
  },
];

export function RefineProvider({ children }: { children: React.ReactNode }) {
  return (
    <Refine
      routerProvider={routerProvider}
      dataProvider={dataProvider}
      authProvider={authProvider}
      notificationProvider={notificationProvider}
      resources={resources}
      options={{
        syncWithLocation: true,
        warnWhenUnsavedChanges: true,
        disableTelemetry: true,
        reactQuery: { clientConfig: { defaultOptions: { queries: { retry: 1, staleTime: 15_000 } } } },
      }}
    >
      {children}
    </Refine>
  );
}
