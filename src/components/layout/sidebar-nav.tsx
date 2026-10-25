"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { NAV_GROUPS, isActive } from "./nav";

export const NAV_STORAGE_KEY = "drs.nav.groups";
type OpenMap = Record<string, boolean>;

const EMPTY: OpenMap = {};
let cache: { raw: string | null; map: OpenMap } = { raw: null, map: EMPTY };
const listeners = new Set<() => void>();

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(NAV_STORAGE_KEY);
  } catch {
    return null; // private mode / blocked storage
  }
}
/** Stored open/closed choices, parsed once per distinct raw value (stable for useSyncExternalStore). */
function snapshot(): OpenMap {
  const raw = readRaw();
  if (raw === cache.raw) return cache.map;
  let map: OpenMap = EMPTY;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
      map = Object.fromEntries(Object.entries(parsed).filter(([, v]) => typeof v === "boolean"));
  } catch {
    map = EMPTY; // corrupt value: fall back to defaults
  }
  cache = { raw, map };
  return map;
}
function remember(label: string, open: boolean) {
  try {
    window.localStorage.setItem(NAV_STORAGE_KEY, JSON.stringify({ ...snapshot(), [label]: open }));
  } catch {
    // Storage unavailable: the section still toggles, it just isn't remembered.
  }
  listeners.forEach((l) => l());
}
function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => e.key === NAV_STORAGE_KEY && onChange();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function activeGroupOf(pathname: string): string | undefined {
  return NAV_GROUPS.find((g) => g.label && g.items.some((i) => isActive(pathname, i.href)))?.label;
}

/**
 * Sidebar navigation with collapsible sections (Radix Collapsible). The section holding the
 * current route is always opened when you arrive on it; every other section keeps the
 * open/closed state you last chose, across navigation and visits (localStorage, best effort).
 */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const activeGroup = activeGroupOf(pathname);
  const stored = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  // The section holding the current route is open unless collapsed while on this route.
  const [collapsedOn, setCollapsedOn] = useState<string | null>(null);
  const isOpenGroup = (label: string) =>
    label === activeGroup ? collapsedOn !== pathname : stored[label] === true;
  const navRef = useRef<HTMLElement>(null);

  // Keep the active link in view (e.g. after the drawer opens or a section expands).
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const link = navRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
      if (link && typeof link.scrollIntoView === "function") link.scrollIntoView({ block: "nearest" });
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <nav ref={navRef} aria-label="Main" className="mt-7 -mr-2 flex-1 overflow-y-auto pr-2 pb-4">
      {NAV_GROUPS.map((group) => {
        const list = (
          <ul className="flex flex-col gap-px">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex min-h-9 items-center rounded-md px-3 py-1.5 text-sm leading-5 font-normal transition-colors",
                      active
                        ? "bg-drs-cream/10 font-medium text-drs-cream"
                        : "text-drs-cream/80 hover:bg-drs-cream/5 hover:text-drs-cream",
                    )}
                  >
                    {active && (
                      <span aria-hidden className="absolute inset-y-1.5 left-0 w-0.5 rounded-r bg-drs-gold" />
                    )}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        );
        if (!group.label) {
          return (
            <div key="home" className="mb-3">
              {list}
            </div>
          );
        }
        const isOpen = isOpenGroup(group.label);
        const containsActive = group.label === activeGroup;
        return (
          <Collapsible.Root
            key={group.label}
            open={isOpen}
            onOpenChange={(next) => {
              if (group.label === activeGroup) setCollapsedOn(next ? null : pathname);
              remember(group.label, next);
            }}
            className="mt-1"
          >
            <Collapsible.Trigger
              className={cn(
                "group flex min-h-9 w-full items-center justify-between gap-2 rounded-md px-3 text-left text-[0.6875rem] leading-4 font-semibold tracking-[0.14em] uppercase transition-colors hover:bg-drs-cream/5 hover:text-drs-cream",
                containsActive ? "text-drs-cream" : "text-drs-cream/75",
              )}
            >
              <span>
                {group.label}
                {containsActive && !isOpen && <span className="sr-only"> (contains the current page)</span>}
              </span>
              <ChevronDownIcon
                aria-hidden
                className="size-3.5 shrink-0 -rotate-90 transition-transform duration-200 group-data-[state=open]:rotate-0"
                strokeWidth={2.25}
              />
            </Collapsible.Trigger>
            <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down motion-reduce:animate-none">
              <div className="pt-0.5 pb-2">{list}</div>
            </Collapsible.Content>
          </Collapsible.Root>
        );
      })}
    </nav>
  );
}
