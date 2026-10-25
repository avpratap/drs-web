"use client";

import { useCallback, useEffect, useState } from "react";

/** Escape inside a popup within a native modal <dialog> closes only the popup. */
let swallowCancelUntil = 0;
export const swallowDialogCancel = () => {
  swallowCancelUntil = Date.now() + 250;
};

/**
 * Radix popups portal to <body> by default, which sits *behind* a native modal <dialog>
 * (top layer) and is inert while it's open. This returns the dialog enclosing `anchor`
 * (resolved when the popup opens) to use as the portal container, and stops the dialog's
 * own Escape handling from also closing it when Escape was meant for the popup.
 */
export function useDialogContainer(anchor: React.RefObject<HTMLElement | null>) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const resolve = useCallback(() => setContainer(anchor.current?.closest("dialog") ?? null), [anchor]);
  useEffect(() => {
    if (!container) return;
    const onCancel = (e: Event) => {
      if (Date.now() < swallowCancelUntil) e.preventDefault();
    };
    container.addEventListener("cancel", onCancel);
    return () => container.removeEventListener("cancel", onCancel);
  }, [container]);
  return { container, resolve };
}
