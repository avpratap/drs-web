"use client";

import { BellIcon, HeartIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api/browser";
import { cn } from "@/lib/utils";
import { useCart } from "./cart";

/**
 * Per-customer storefront state beyond the cart: wishlisted product ids (hearts on cards and
 * the PDP) and the unread notification count (header bell). Loaded once a customer session
 * is known; signed-out visitors get empty state and a sign-in prompt on first use.
 */
type EngagementApi = {
  wishlist: ReadonlySet<number>;
  wishlistReady: boolean;
  toggleWishlist: (productId: number) => Promise<{ ok: boolean; message?: string }>;
  removeFromWishlist: (productId: number) => Promise<void>;
  unread: number;
  refreshUnread: () => Promise<void>;
  setUnread: (n: number) => void;
};
const EngagementContext = createContext<EngagementApi | null>(null);
const EMPTY: ReadonlySet<number> = new Set();

export function EngagementProvider({ children }: { children: React.ReactNode }) {
  const { session } = useCart();
  const router = useRouter();
  const [wishlist, setWishlist] = useState<ReadonlySet<number>>(EMPTY);
  const [wishlistReady, setWishlistReady] = useState(false);
  const [unread, setUnread] = useState(0);

  const refreshUnread = useCallback(async () => {
    const { data } = await api.GET("/api/v1/notifications/unread-count").catch(() => ({ data: undefined }));
    if (data) setUnread(data.unread);
  }, []);

  useEffect(() => {
    if (session !== "customer") return;
    let live = true;
    void Promise.all([
      api.GET("/api/v1/wishlist").catch(() => ({ data: undefined })),
      api.GET("/api/v1/notifications/unread-count").catch(() => ({ data: undefined })),
    ]).then(([w, n]) => {
      if (!live) return;
      setWishlist(new Set((w.data ?? []).map((i) => i.product_id)));
      setWishlistReady(true);
      setUnread(n.data?.unread ?? 0);
    });
    return () => {
      live = false;
    };
  }, [session]);

  const toggleWishlist = useCallback(
    async (productId: number) => {
      if (session !== "customer") {
        router.push(`/account/login?next=${encodeURIComponent(window.location.pathname)}`);
        return { ok: false, message: "Sign in to save products." };
      }
      const had = wishlist.has(productId);
      const next = new Set(wishlist);
      if (had) next.delete(productId);
      else next.add(productId);
      setWishlist(next); // optimistic; rolled back on failure
      try {
        const res = had
          ? await api.DELETE("/api/v1/wishlist/{product_id}", { params: { path: { product_id: productId } } })
          : await api.POST("/api/v1/wishlist", { body: { product_id: productId } });
        if (!res.response.ok) throw new Error();
        return { ok: true };
      } catch {
        setWishlist(wishlist);
        return { ok: false, message: "Couldn't update your wishlist. Please try again." };
      }
    },
    [session, wishlist, router],
  );

  const removeFromWishlist = useCallback(
    async (productId: number) => {
      if (wishlist.has(productId)) await toggleWishlist(productId);
    },
    [wishlist, toggleWishlist],
  );

  const value = useMemo(
    () => ({
      wishlist: session === "customer" ? wishlist : EMPTY,
      wishlistReady,
      toggleWishlist,
      removeFromWishlist,
      unread: session === "customer" ? unread : 0,
      refreshUnread,
      setUnread,
    }),
    [session, wishlist, wishlistReady, toggleWishlist, removeFromWishlist, unread, refreshUnread],
  );
  return <EngagementContext.Provider value={value}>{children}</EngagementContext.Provider>;
}

export function useEngagement(): EngagementApi {
  const ctx = useContext(EngagementContext);
  if (!ctx) throw new Error("useEngagement must be used inside <EngagementProvider>");
  return ctx;
}

/** Heart toggle: an icon button on product cards, a labelled button on the PDP. */
export function WishlistButton({
  productId,
  productName,
  variant = "icon",
  className,
}: {
  productId: number;
  productName: string;
  variant?: "icon" | "full";
  className?: string;
}) {
  const { wishlist, toggleWishlist } = useEngagement();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const saved = wishlist.has(productId);
  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    const r = await toggleWishlist(productId);
    setMsg(
      r.ok
        ? saved
          ? `Removed ${productName} from your wishlist`
          : `Saved ${productName} to your wishlist`
        : (r.message ?? ""),
    );
    setBusy(false);
  };
  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={onClick}
          disabled={busy}
          aria-pressed={saved}
          aria-label={`Save ${productName} to wishlist`}
          className={cn(
            "relative z-10 grid size-11 place-items-center rounded-full bg-drs-white/95 text-drs-maroon shadow-sm transition-colors hover:bg-drs-white",
            className,
          )}
        >
          <HeartIcon aria-hidden className={cn("size-5", saved && "fill-drs-maroon")} strokeWidth={1.75} />
        </button>
      ) : (
        <button
          type="button"
          onClick={onClick}
          disabled={busy}
          aria-pressed={saved}
          className={cn(
            "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors",
            saved
              ? "border-drs-maroon/30 bg-drs-maroon/5 text-drs-maroon"
              : "border-drs-ink/20 bg-drs-white text-drs-ink hover:border-drs-maroon/40",
            className,
          )}
        >
          <HeartIcon
            aria-hidden
            className={cn("size-4", saved && "fill-drs-maroon text-drs-maroon")}
            strokeWidth={1.75}
          />
          {saved ? "Saved to wishlist" : "Save to wishlist"}
        </button>
      )}
      <span role="status" className="sr-only">
        {msg}
      </span>
    </>
  );
}

/** Header bell with the unread badge (customers only). */
export function NotificationBell() {
  const { session } = useCart();
  const { unread } = useEngagement();
  if (session !== "customer") return null;
  return (
    <Link
      href="/account/notifications"
      prefetch={false}
      aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
      className="relative grid size-11 place-items-center rounded-full text-drs-green transition-colors hover:bg-drs-green/10"
    >
      <BellIcon aria-hidden className="size-5.5" strokeWidth={1.75} />
      {unread > 0 && (
        <span
          aria-hidden
          className="absolute top-1 right-1 grid min-w-5 place-items-center rounded-full bg-drs-maroon px-1 text-[0.6875rem] leading-5 font-semibold text-drs-cream"
        >
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
