import { CartProvider } from "@/components/store/cart";
import { CookieBanner } from "@/components/store/cookie-banner";
import { EngagementProvider } from "@/components/store/engagement";
import { StoreFooter } from "@/components/store/store-footer";
import { StoreHeader } from "@/components/store/store-header";

/** Customer storefront chrome: header (nav, search, account, notifications, cart), page, footer, cookie notice. */
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <EngagementProvider>
        <a
          href="#content"
          className="sr-only z-50 rounded bg-drs-white px-3 py-2 text-drs-green focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Skip to content
        </a>
        {/* pb: room for the cookie notice while it's shown (it sets --banner-h). */}
        <div className="flex min-h-dvh flex-col pb-[var(--banner-h,0px)]">
          <StoreHeader />
          <main id="content" className="flex-1">
            {children}
          </main>
          <StoreFooter />
        </div>
        <CookieBanner />
      </EngagementProvider>
    </CartProvider>
  );
}
