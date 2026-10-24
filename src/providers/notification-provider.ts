import type { NotificationProvider, OpenNotificationParams } from "@refinedev/core";

export type Toast = OpenNotificationParams & { key: string };

let toasts: Toast[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
let seq = 0;

export const toastStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get: () => toasts,
  dismiss(key: string) {
    toasts = toasts.filter((t) => t.key !== key);
    emit();
  },
};

export const notificationProvider: NotificationProvider = {
  open(params) {
    const key = params.key ?? `t${++seq}`;
    toasts = [...toasts.filter((t) => t.key !== key), { ...params, key }];
    emit();
    if (params.type !== "progress") setTimeout(() => toastStore.dismiss(key), 5000);
  },
  close: (key) => toastStore.dismiss(key),
};
