import type { Metadata } from "next";
import { Suspense } from "react";
import { RefineProvider } from "@/providers/refine-provider";

export const metadata: Metadata = {
  title: { default: "DRS Admin", template: "%s · DRS Admin" },
  description: "DRS dairy platform — admin dashboard",
  robots: { index: false, follow: false, nocache: true },
};

/** Everything under /admin (dashboard + login) runs inside Refine. */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <RefineProvider>{children}</RefineProvider>
    </Suspense>
  );
}
