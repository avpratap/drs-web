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
    // Defensive: the shell uses overflow:clip so it can't scroll, but on any browser
    // without clip support (where it falls back to a scrollable box) Next's post-nav
    // scrollIntoView could still shift it and hide the header — pin it back to 0.
    const shell = document.getElementById("app-shell");
    if (shell && shell.scrollTop !== 0) shell.scrollTop = 0;
  }, [pathname]);
  return null;
}
