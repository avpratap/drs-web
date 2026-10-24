"use client";

import { Authenticated } from "@refinedev/core";
import { AppShell } from "@/components/layout/app-shell";

function FullPageLoader() {
  return (
    <div className="grid min-h-dvh place-items-center" role="status" aria-label="Loading">
      <span className="size-8 animate-spin rounded-full border-2 border-drs-green border-r-transparent" />
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Authenticated key="admin" loading={<FullPageLoader />} appendCurrentPathToQuery={false}>
      <AppShell>{children}</AppShell>
    </Authenticated>
  );
}
