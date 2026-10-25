"use client";

import { MenuIcon, SearchIcon, ShoppingBagIcon, UserRoundIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useCart } from "./cart";
import { STORE_NAV } from "./nav";

const iconBtn =
  "relative grid size-11 place-items-center rounded-full text-drs-green transition-colors hover:bg-drs-green/10";

export function CartButton() {
  const { count } = useCart();
  return (
    <Link
      href="/cart"
      className={iconBtn}
      aria-label={count ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart, empty"}
    >
      <ShoppingBagIcon aria-hidden className="size-5.5" strokeWidth={1.75} />
      {count > 0 && (
        <span
          aria-hidden
          className="absolute top-1 right-1 grid min-w-5 place-items-center rounded-full bg-drs-maroon px-1 text-[0.6875rem] leading-5 font-semibold text-drs-cream"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

export function AccountButton() {
  return (
    // No prefetch: /account redirects signed-out visitors to sign-in, so there's nothing to warm.
    <Link href="/account" prefetch={false} className={iconBtn} aria-label="Your account">
      <UserRoundIcon aria-hidden className="size-5.5" strokeWidth={1.75} />
    </Link>
  );
}

/** Product search: a plain GET form so it works before hydration and stays shareable. */
export function SearchForm({ className, id = "store-search" }: { className?: string; id?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      action="/products"
      className={cn("relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        const term = q.trim();
        router.push(term ? `/products?q=${encodeURIComponent(term)}` : "/products");
      }}
    >
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-drs-ink/60"
      />
      <input
        id={id}
        name="q"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search milk, ghee, paneer…"
        className="h-11 w-full rounded-full border border-drs-ink/15 bg-drs-white pr-4 pl-10 text-sm text-drs-ink placeholder:text-drs-ink/60 transition-colors hover:border-drs-green/40 focus-visible:border-drs-green"
      />
    </form>
  );
}

/** Mobile navigation drawer (below lg). */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  // Read when opened (not via usePathname) so the header can prerender on dynamic routes.
  const [pathname, setPathname] = useState("");
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);
  return (
    <>
      <button
        type="button"
        className={cn(iconBtn, "lg:hidden")}
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="store-menu"
        onClick={() => {
          setPathname(window.location.pathname);
          setOpen(true);
        }}
      >
        <MenuIcon aria-hidden className="size-6" strokeWidth={1.75} />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          id="store-menu"
        >
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-drs-ink/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col bg-drs-cream shadow-xl">
            <div className="flex items-center justify-between border-b border-drs-ink/10 px-4 py-3">
              <span className="text-sm font-semibold tracking-[0.18em] text-drs-green uppercase">Menu</span>
              <button
                type="button"
                className={iconBtn}
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <XIcon aria-hidden className="size-5" />
              </button>
            </div>
            <div className="p-4">
              <SearchForm id="store-search-mobile" />
            </div>
            <nav aria-label="Store" className="flex flex-col px-2">
              {STORE_NAV.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={pathname === l.href ? "page" : undefined}
                  className="flex min-h-12 items-center rounded-lg px-3 text-base font-medium text-drs-ink hover:bg-drs-green/5 aria-[current=page]:text-drs-green"
                >
                  {l.label}
                </Link>
              ))}
              <Link
                href="/account"
                prefetch={false}
                onClick={() => setOpen(false)}
                className="mt-2 flex min-h-12 items-center rounded-lg border-t border-drs-ink/10 px-3 text-base font-medium text-drs-ink hover:bg-drs-green/5"
              >
                Your account
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
