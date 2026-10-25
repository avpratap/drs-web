"use client";

import { useSyncExternalStore } from "react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { toastStore } from "@/providers/notification-provider";

const noToasts: never[] = [];
const serverToasts = () => noToasts;

/**
 * Renders Refine's notifications (useApiAction, CRUD mutations…) as Radix toasts: announced
 * politely (errors assertively), swipe/Esc to dismiss, paused while hovered or focused.
 */
export function Toaster() {
  const toasts = useSyncExternalStore(toastStore.subscribe, toastStore.get, serverToasts);
  return (
    <ToastProvider swipeDirection="right" duration={5000}>
      {toasts.map((t) => (
        <Toast
          key={t.key}
          variant={t.type === "error" ? "error" : t.type === "success" ? "success" : "default"}
          type={t.type === "error" ? "foreground" : "background"}
          duration={t.type === "progress" ? Infinity : 5000}
          onOpenChange={(open) => !open && toastStore.dismiss(t.key)}
        >
          <div className="grid gap-1">
            <ToastTitle className={t.type === "error" ? "text-drs-maroon" : undefined}>
              {t.message}
            </ToastTitle>
            {t.description && <ToastDescription>{t.description}</ToastDescription>}
          </div>
          <ToastClose aria-label="Dismiss notification" />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
