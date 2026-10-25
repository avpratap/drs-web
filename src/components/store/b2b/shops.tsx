"use client";

import { StoreIcon } from "lucide-react";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useState } from "react";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api/browser";
import { pickShop, SHOP_KEY, type Shop } from "@/modules/store/b2b";
import { detailOf } from "../cart";

type ShopsApi = {
  /** null while loading. */
  shops: Shop[] | null;
  error: string | null;
  current: Shop | null;
  setCurrent: (id: number) => void;
  added: (shop: Shop) => void;
};
const ShopsContext = createContext<ShopsApi | null>(null);

function remembered(): number | null {
  try {
    const v = Number(window.localStorage.getItem(SHOP_KEY));
    return Number.isSafeInteger(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

/** The subscriber's shops (GET /shops) and which one the business pages are looking at. */
export function ShopsProvider({ children }: { children: React.ReactNode }) {
  const [shops, setShops] = useState<Shop[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentId, setCurrentId] = useState<number | null>(null);

  useEffect(() => {
    let live = true;
    api
      .GET("/api/v1/shops", { params: { query: { limit: 100 } } })
      .then(({ data, error: err }) => {
        if (!live) return;
        if (data) {
          setShops(data);
          setCurrentId(pickShop(data, remembered())?.id ?? null);
        } else setError(detailOf(err) ?? "Couldn't load your shops.");
      })
      .catch(() => live && setError("You seem to be offline."));
    return () => {
      live = false;
    };
  }, []);

  const setCurrent = useCallback((id: number) => {
    setCurrentId(id);
    try {
      window.localStorage.setItem(SHOP_KEY, String(id));
    } catch {
      // Private mode: the choice just isn't remembered.
    }
  }, []);

  const added = useCallback(
    (shop: Shop) => {
      setShops((s) => [...(s ?? []), shop]);
      setCurrent(shop.id);
    },
    [setCurrent],
  );

  const value = useMemo(
    () => ({
      shops,
      error,
      current: shops?.find((s) => s.id === currentId) ?? null,
      setCurrent,
      added,
    }),
    [shops, error, currentId, setCurrent, added],
  );
  return <ShopsContext.Provider value={value}>{children}</ShopsContext.Provider>;
}

export function useShops(): ShopsApi {
  const ctx = useContext(ShopsContext);
  if (!ctx) throw new Error("useShops must be used inside <ShopsProvider>");
  return ctx;
}

/** "Showing: <shop>" — a switcher when the account has more than one shop. */
export function ShopSwitcher() {
  const { shops, current, setCurrent } = useShops();
  const id = useId();
  if (!shops)
    return (
      <div
        aria-hidden
        className="mb-5 h-11 w-64 animate-pulse rounded-lg bg-drs-ink/[0.06] motion-reduce:animate-none"
      />
    );
  if (!shops.length)
    return (
      <p className="mb-5 rounded-2xl border border-dashed border-drs-ink/20 bg-drs-white px-4 py-3 text-sm text-drs-ink/75">
        Add your first shop to start a standing order.{" "}
        <Link href="/account/shops" className="font-medium text-drs-green underline underline-offset-2">
          Add a shop
        </Link>
      </p>
    );
  if (shops.length === 1)
    return (
      <p className="mb-5 flex items-center gap-2 text-sm text-drs-ink/75">
        <StoreIcon aria-hidden className="size-4 text-drs-green" />
        <span>
          Shop: <span className="font-medium text-drs-ink">{current?.name ?? shops[0].name}</span>
        </span>
      </p>
    );
  return (
    <div className="mb-5 flex max-w-md flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
      <label id={`${id}-l`} className="flex shrink-0 items-center gap-2 text-sm font-medium text-drs-ink">
        <StoreIcon aria-hidden className="size-4 text-drs-green" /> Showing shop
      </label>
      <Select
        id={`${id}-t`}
        aria-labelledby={`${id}-l ${id}-t`}
        value={current?.id ?? ""}
        onChange={(v) => setCurrent(Number(v))}
        options={shops.map((s) => ({
          value: s.id,
          label: s.status === "active" ? s.name : `${s.name} (inactive)`,
        }))}
      />
    </div>
  );
}
