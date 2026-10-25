import { CartProvider } from "@/components/store/cart";
import { StoreFooter } from "@/components/store/store-footer";
import { StoreHeader } from "@/components/store/store-header";

/** Customer storefront chrome: header (nav, search, account, cart), page, footer. */
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <a
        href="#content"
        className="sr-only z-50 rounded bg-drs-white px-3 py-2 text-drs-green focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <div className="flex min-h-dvh flex-col">
        <StoreHeader />
        <main id="content" className="flex-1">
          {children}
        </main>
        <StoreFooter />
      </div>
    </CartProvider>
  );
}
