import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountNav, ActiveAccountNav } from "@/components/store/account-nav";

export const metadata: Metadata = {
  title: { default: "Your account", template: "%s · Your account · DRS Dairy" },
  robots: { index: false, follow: false },
};

/** Signed-in customer area (the proxy gates /account/** to customers and subscribers). */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-16 md:px-6 md:pt-10 md:pb-24 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-start lg:gap-10">
      <div className="lg:sticky lg:top-28">
        <Suspense fallback={<AccountNav />}>
          <ActiveAccountNav />
        </Suspense>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
