"use client";

import { HomeIcon, LogOutIcon, MapPinIcon, PackageIcon, UserRoundIcon, WalletIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useCart } from "./cart";

export const ACCOUNT_NAV = [
  { href: "/account", label: "Overview", icon: HomeIcon },
  { href: "/account/orders", label: "Orders", icon: PackageIcon },
  { href: "/account/wallet", label: "Wallet", icon: WalletIcon },
  { href: "/account/addresses", label: "Addresses", icon: MapPinIcon },
  { href: "/account/profile", label: "Profile", icon: UserRoundIcon },
] as const;

export const isAccountActive = (pathname: string, href: string) =>
  href === "/account" ? pathname === "/account" : pathname === href || pathname.startsWith(`${href}/`);

function SignOut({ className }: { className?: string }) {
  const router = useRouter();
  const { refresh } = useCart();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch(`${window.location.origin}/api/store-auth/logout`, {
          method: "POST",
          credentials: "same-origin",
        }).catch(() => undefined);
        await refresh();
        router.replace("/");
        router.refresh();
      }}
      className={className}
    >
      <LogOutIcon aria-hidden className="size-4 shrink-0" />
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}

/** Account sections: a scrollable pill row on phones, a sidebar card from lg. */
export function AccountNav({ pathname }: { pathname?: string }) {
  return (
    <nav aria-label="Account" className="mb-6 lg:mb-0">
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-2xl lg:border lg:border-drs-ink/10 lg:bg-drs-white lg:p-2 lg:shadow-sm">
        {ACCOUNT_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname ? isAccountActive(pathname, href) : false;
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                // On phones the row scrolls sideways: keep the current section in view.
                ref={active ? (el) => el?.scrollIntoView({ block: "nearest", inline: "nearest" }) : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-2.5 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors lg:rounded-xl lg:border-transparent lg:px-3",
                  active
                    ? "border-drs-green bg-drs-green text-drs-cream lg:bg-drs-green/10 lg:text-drs-green"
                    : "border-drs-ink/15 bg-drs-white text-drs-ink hover:border-drs-green/50 lg:bg-transparent lg:hover:bg-drs-green/5",
                )}
              >
                <Icon aria-hidden className="size-4 shrink-0" />
                {label}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0 lg:mt-1 lg:border-t lg:border-drs-ink/10 lg:pt-1">
          <SignOut className="flex min-h-11 items-center gap-2.5 rounded-full border border-drs-ink/15 bg-drs-white px-4 text-sm font-medium whitespace-nowrap text-drs-maroon transition-colors hover:bg-drs-maroon/5 disabled:opacity-60 lg:w-full lg:rounded-xl lg:border-transparent lg:bg-transparent lg:px-3" />
        </li>
      </ul>
    </nav>
  );
}

/** Reads the current path (client) to mark the active section. */
export function ActiveAccountNav() {
  return <AccountNav pathname={usePathname()} />;
}
