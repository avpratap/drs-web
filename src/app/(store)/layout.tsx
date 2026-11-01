import { Suspense } from "react";
import { CartProvider } from "@/components/store/cart";
import { CookieBanner } from "@/components/store/cookie-banner";
import { EngagementProvider } from "@/components/store/engagement";
import { ScrollReset } from "@/components/store/scroll-region";
import { StoreFooter } from "@/components/store/store-footer";
import { StoreHeader } from "@/components/store/store-header";

/** Customer storefront chrome: header (nav, search, account, notifications, cart), page, footer, cookie notice. */
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <EngagementProvider>
        <a
          href="#content"
          className="sr-only z-[70] rounded bg-drs-white px-3 py-2 text-drs-green focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Skip to content
        </a>
        {/* App shell: fixed to the viewport (out of document flow) so the page itself
            never scrolls — the green bar + nav stay put and ONLY ScrollRegion scrolls, so
            there's a single scrollbar that starts below the nav, never a full-height one.
            ScrollRegion pads its bottom by the cookie notice height (--banner-h).

            overflow-CLIP (not hidden): `overflow:hidden` is still a scroll *container* and
            can be moved programmatically. After a client-side navigation Next's focus/
            scroll handling calls scrollIntoView, which scrolled THIS shell by one header
            height — hiding the nav until a full refresh. `overflow:clip` is not a scroll
            container, so scrollIntoView falls through to #scroll-region (the intended
            scroller) and the header can never be pushed off-screen. */}
        <div id="app-shell" className="fixed inset-0 flex flex-col overflow-clip">
          <StoreHeader />
          {/* The single scroll area: header stays above it, so the scrollbar starts
              below the nav. pb leaves room for the cookie notice (--banner-h). */}
          <div
            id="scroll-region"
            className="flex min-h-0 flex-1 flex-col overflow-y-auto scroll-pt-[1rem] pb-[var(--banner-h,0px)]"
          >
            <main id="content" className="flex-1">
              {children}
            </main>
            <StoreFooter />
          </div>
          {/* Resets #scroll-region to top on navigation; isolated in Suspense because it
              reads usePathname (runtime URL data) which otherwise blocks prerendering. */}
          <Suspense fallback={null}>
            <ScrollReset />
          </Suspense>
        </div>
        <CookieBanner />
      </EngagementProvider>
    </CartProvider>
  );
}
