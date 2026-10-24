"use client";

import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/nextjs-router";
import { authProvider } from "./auth-provider";
import { dataProvider } from "./data-provider";
import { notificationProvider } from "./notification-provider";
import { resources } from "@/modules/resources";

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
