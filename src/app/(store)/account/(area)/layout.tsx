import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { AccountNav, ActiveAccountNav } from "@/components/store/account-nav";
import { isSubscriberToken } from "@/lib/auth/jwt";
import { ACCESS_COOKIE } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: { default: "Your account", template: "%s · Your account · DRS Dairy" },
  robots: { index: false, follow: false },
};

/** The role claim only decides which sections are listed; the proxy and backend enforce access. */
async function RoleNav() {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  return <ActiveAccountNav subscriber={isSubscriberToken(token)} />;
}

/** Signed-in customer area (the proxy gates /account/** to customers and subscribers). */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-16 md:px-6 md:pt-10 md:pb-24 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-start lg:gap-10">
      <div className="lg:sticky lg:top-28">
        <Suspense fallback={<AccountNav />}>
          <RoleNav />
        </Suspense>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
