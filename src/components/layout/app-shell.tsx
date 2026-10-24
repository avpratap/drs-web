"use client";

import { useGetIdentity, useLogout } from "@refinedev/core";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { NAV_GROUPS, isActive } from "./nav";
import { Toaster } from "./toaster";

function initials(name?: string): string {
  const words = (name ?? "").split(/\s+/).filter((w) => /^[a-z]/i.test(w));
  return (words.length ? words.slice(0, 2).map((w) => w[0]) : ["A"]).join("").toUpperCase();
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3 rounded-md px-2 py-1">
      <span
        aria-hidden
        className="grid size-9 place-items-center rounded-full border border-drs-gold text-sm font-semibold text-drs-cream"
      >
        D
      </span>
      <span className="leading-tight">
        <span className="block text-base font-semibold tracking-wide text-drs-cream">DRS</span>
        <span className="block text-[11px] tracking-[0.2em] text-drs-cream/80 uppercase">Admin</span>
      </span>
    </Link>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="mt-6 -mr-2 flex-1 overflow-y-auto pr-2 pb-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label || "home"} className="mt-4 first:mt-0">
          {group.label && (
            <p className="mb-1 px-3 text-[11px] font-semibold tracking-[0.18em] text-drs-cream/80 uppercase">
              {group.label}
            </p>
          )}
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex min-h-10 items-center rounded-lg px-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-drs-cream/10 text-drs-cream"
                        : "text-drs-cream/80 hover:bg-drs-cream/5 hover:text-drs-cream",
                    )}
                  >
                    {active && (
                      <span aria-hidden className="absolute inset-y-2 left-0 w-1 rounded-r bg-drs-gold" />
                    )}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data: user } = useGetIdentity<{ name?: string; phone?: string }>();
  const { mutate: logout, isPending: loggingOut } = useLogout();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <a
        href="#main"
        className="sr-only z-50 rounded bg-drs-white px-3 py-2 text-drs-green focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="on-dark sticky top-0 hidden h-dvh flex-col bg-drs-green px-4 py-6 lg:flex">
        <Brand />
        <SidebarNav />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-drs-ink/50"
            onClick={() => setOpen(false)}
          />
          <aside className="on-dark absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-drs-green px-4 py-6">
            <Brand />
            <SidebarNav onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-drs-ink/10 bg-drs-white/95 px-4 backdrop-blur md:px-6">
          <button
            type="button"
            className="-ml-2 grid size-11 place-items-center rounded-lg text-drs-green hover:bg-drs-green/10 lg:hidden"
            aria-label="Open navigation"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="size-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-drs-green lg:hidden">DRS Admin</span>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-drs-ink/80 md:inline">{user?.name}</span>
            <span
              aria-hidden
              className="grid size-9 place-items-center rounded-full bg-drs-green text-xs font-semibold text-drs-cream ring-2 ring-drs-gold/70"
            >
              {initials(user?.name)}
            </span>
            <button
              type="button"
              onClick={() => logout()}
              disabled={loggingOut}
              className="min-h-11 rounded-lg px-3 text-sm font-medium text-drs-green hover:bg-drs-green/10"
            >
              Sign out
            </button>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-8 xl:px-10">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
