"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Resets the storefront scroll area (#scroll-region) to the top on navigation.
 *
 * The app shell is fixed / overflow-hidden, so the window never scrolls and Next's
 * default scroll-to-top has nothing to reset — we do it here on each pathname change.
 *
 * usePathname() reads runtime URL data, which blocks prerendering under
 * `cacheComponents`, so this is kept as its own tiny component that renders nothing
 * and MUST be mounted inside <Suspense> (see the store layout).
 */
export function ScrollReset() {
  const pathname = usePathname();
  useEffect(() => {
    // Instant (not smooth) so a route change lands at the top like a normal page load.
    document
      .getElementById("scroll-region")
      ?.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  // The app shell is fixed + overflow-hidden, but overflow-hidden is still a scroll
  // *container*: Next's post-navigation scrollIntoView/focus can scroll it by a header
  // height, hiding the nav until a full refresh. We keep it overflow-hidden (so native
  // lazy image loading is unchanged) and instead pin it: reset to 0 now and on any scroll.
  // Resetting inside the scroll handler settles immediately (scrollTo(0,0) when already at
  // 0 is a no-op), so there's no loop.
  useEffect(() => {
    const shell = document.getElementById("app-shell");
    if (!shell) return;
    const pin = () => {
      if (shell.scrollTop !== 0 || shell.scrollLeft !== 0) shell.scrollTo(0, 0);
    };
    pin();
    shell.addEventListener("scroll", pin, { passive: true });
    return () => shell.removeEventListener("scroll", pin);
  }, []);

  return null;
}
