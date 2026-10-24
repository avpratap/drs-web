"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { toastStore } from "@/providers/notification-provider";

export function Toaster() {
  const toasts = useSyncExternalStore(toastStore.subscribe, toastStore.get, () => []);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 md:inset-x-auto md:right-6"
    >
      {toasts.map((t) => (
        <div
          key={t.key}
          role={t.type === "error" ? "alert" : "status"}
          className={cn(
            "pointer-events-auto w-full max-w-sm rounded-lg border-l-4 bg-drs-white p-4 text-sm text-drs-ink shadow-lg",
            t.type === "error" ? "border-drs-maroon" : "border-drs-green",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{t.message}</p>
              {t.description && <p className="mt-1 text-drs-ink/75">{t.description}</p>}
            </div>
            <button
              type="button"
              onClick={() => toastStore.dismiss(t.key)}
              className="-m-2 p-2 text-drs-ink/60 hover:text-drs-ink"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
