"use client";

import {
  BellIcon,
  CalendarClockIcon,
  ReceiptTextIcon,
  RepeatIcon,
  StoreIcon,
  GiftIcon,
  HeartIcon,
  HomeIcon,
  LifeBuoyIcon,
  LogOutIcon,
  MapPinIcon,
  PackageIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserRoundIcon,
  WalletIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useCart } from "./cart";

type NavItem = { href: string; label: string; icon: typeof HomeIcon };

export const ACCOUNT_NAV: readonly NavItem[] = [
  { href: "/account", label: "Overview", icon: HomeIcon },
  { href: "/account/orders", label: "Orders", icon: PackageIcon },
  { href: "/account/wallet", label: "Wallet", icon: WalletIcon },
  { href: "/account/rewards", label: "Rewards", icon: SparklesIcon },
  { href: "/account/gift-cards", label: "Gift cards", icon: GiftIcon },
  { href: "/account/wishlist", label: "Wishlist", icon: HeartIcon },
  { href: "/account/notifications", label: "Notifications", icon: BellIcon },
  { href: "/account/support", label: "Help & support", icon: LifeBuoyIcon },
  { href: "/account/addresses", label: "Addresses", icon: MapPinIcon },
  { href: "/account/profile", label: "Profile", icon: UserRoundIcon },
  { href: "/account/privacy", label: "Privacy", icon: ShieldCheckIcon },
];

/** B2B self-service, listed (and routable — see the proxy) for subscribers only. */
export const BUSINESS_NAV: readonly NavItem[] = [
  { href: "/account/subscriptions", label: "Subscriptions", icon: RepeatIcon },
  { href: "/account/deliveries", label: "Deliveries", icon: CalendarClockIcon },
  { href: "/account/invoices", label: "Invoices", icon: ReceiptTextIcon },
  { href: "/account/shops", label: "Shops", icon: StoreIcon },
];

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

const linkClass = (active: boolean) =>
  cn(
    "flex min-h-11 items-center gap-2.5 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors lg:rounded-xl lg:border-transparent lg:px-3",
    active
      ? "border-drs-green bg-drs-green text-drs-cream lg:bg-drs-green/10 lg:text-drs-green"
      : "border-drs-ink/15 bg-drs-white text-drs-ink hover:border-drs-green/50 lg:bg-transparent lg:hover:bg-drs-green/5",
  );

function NavLinks({ items, pathname }: { items: readonly NavItem[]; pathname?: string }) {
  return items.map(({ href, label, icon: Icon }) => {
    const active = pathname ? isAccountActive(pathname, href) : false;
    return (
      <li key={href} className="shrink-0">
        <Link
          href={href}
          // Account pages are dynamic and load their data client-side; a full prefetch of
          // every section keeps streams open (and the network busy) for no gain.
          prefetch={false}
          aria-current={active ? "page" : undefined}
          // On phones the row scrolls sideways: keep the current section in view.
          ref={active ? (el) => el?.scrollIntoView({ block: "nearest", inline: "nearest" }) : undefined}
          className={linkClass(active)}
        >
          <Icon aria-hidden className="size-4 shrink-0" />
          {label}
        </Link>
      </li>
    );
  });
}

/**
 * Account sections: a scrollable pill row on phones, a sidebar card from lg. Subscribers also
 * get the business section (subscriptions, deliveries, invoices, shops) after the overview.
 */
export function AccountNav({ pathname, subscriber }: { pathname?: string; subscriber?: boolean }) {
  return (
    <nav aria-label="Account" className="mb-6 lg:mb-0">
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-2xl lg:border lg:border-drs-ink/10 lg:bg-drs-white lg:p-2 lg:shadow-sm">
        <NavLinks items={ACCOUNT_NAV.slice(0, 1)} pathname={pathname} />
        {subscriber && (
          <>
            <li
              aria-hidden
              className="hidden px-3 pt-2 text-xs font-semibold tracking-wide text-drs-ink/70 uppercase lg:block"
            >
              Business
            </li>
            <NavLinks items={BUSINESS_NAV} pathname={pathname} />
            <li
              aria-hidden
              className="hidden px-3 pt-2 text-xs font-semibold tracking-wide text-drs-ink/70 uppercase lg:block"
            >
              Personal
            </li>
          </>
        )}
        <NavLinks items={ACCOUNT_NAV.slice(1)} pathname={pathname} />
        <li className="shrink-0 lg:mt-1 lg:border-t lg:border-drs-ink/10 lg:pt-1">
          <SignOut className="flex min-h-11 items-center gap-2.5 rounded-full border border-drs-ink/15 bg-drs-white px-4 text-sm font-medium whitespace-nowrap text-drs-maroon transition-colors hover:bg-drs-maroon/5 disabled:opacity-60 lg:w-full lg:rounded-xl lg:border-transparent lg:bg-transparent lg:px-3" />
        </li>
      </ul>
    </nav>
  );
}

/** Reads the current path (client) to mark the active section. */
export function ActiveAccountNav({ subscriber }: { subscriber?: boolean }) {
  return <AccountNav pathname={usePathname()} subscriber={subscriber} />;
}
