"use client";

import { BellIcon, CheckCheckIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/browser";
import type { components } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { useEngagement } from "./engagement";
import { LoadError, PanelSkeleton, useLoad } from "./use-load";

type Note = components["schemas"]["app__api__v1__inbox__NotificationOut"];

const when = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});
const CATEGORY: Record<string, string> = {
  order: "Order",
  delivery: "Delivery",
  billing: "Wallet & billing",
  payment: "Payment",
  subscription: "Subscription",
  marketing: "Offer",
  support: "Support",
};
export const categoryLabel = (c: string) =>
  CATEGORY[c] ?? c.replace(/_/g, " ").replace(/^\w/, (x) => x.toUpperCase());

/** In-app notifications: unread first in style, mark one or all as read (keeps the bell in sync). */
export function NotificationsView() {
  const { setUnread } = useEngagement();
  const list = useLoad(
    () => api.GET("/api/v1/notifications", { params: { query: { limit: 50 } } }),
    "Couldn't load notifications.",
  );
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [busy, setBusy] = useState(false);

  if (list.error) return <LoadError text={list.error} />;
  if (!list.data) return <PanelSkeleton rows={3} label="Loading notifications" />;
  const notes = list.data;
  const unread = notes.filter((n) => !n.read_at).length;
  const shown = filter === "unread" ? notes.filter((n) => !n.read_at) : notes;

  const markRead = async (n: Note) => {
    const { data } = await api
      .POST("/api/v1/notifications/{notification_id}/read", { params: { path: { notification_id: n.id } } })
      .catch(() => ({ data: undefined }));
    if (!data) return;
    const next = notes.map((x) => (x.id === n.id ? data : x));
    list.setData(next);
    setUnread(next.filter((x) => !x.read_at).length);
  };
  const markAll = async () => {
    setBusy(true);
    const { data } = await api.POST("/api/v1/notifications/read-all").catch(() => ({ data: undefined }));
    if (data) {
      const now = new Date().toISOString();
      list.setData(notes.map((x) => ({ ...x, read_at: x.read_at ?? now })));
      setUnread(0);
    }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Show"
          className="inline-flex rounded-full border border-drs-ink/15 bg-drs-white p-1"
        >
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "min-h-9 rounded-full px-4 text-sm font-medium transition-colors",
                filter === f ? "bg-drs-green text-drs-cream" : "text-drs-ink hover:bg-drs-green/5",
              )}
            >
              {f === "all" ? "All" : `Unread (${unread})`}
            </button>
          ))}
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={markAll}
          disabled={!unread || busy}
          className="rounded-full"
        >
          <CheckCheckIcon aria-hidden className="size-4" /> Mark all as read
        </Button>
      </div>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-drs-ink/20 bg-drs-white/70 px-6 py-12 text-center">
          <BellIcon aria-hidden className="size-9 text-drs-green" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-drs-ink/75">
            {filter === "unread" ? "You're all caught up." : "No notifications yet."}
          </p>
        </div>
      ) : (
        <ul aria-label="Notifications" className="space-y-2">
          {shown.map((n) => {
            const isUnread = !n.read_at;
            return (
              <li
                key={n.id}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-4 shadow-sm",
                  isUnread ? "border-drs-green/25 bg-drs-white" : "border-drs-ink/10 bg-drs-white/70",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-1.5 size-2.5 shrink-0 rounded-full",
                    isUnread ? "bg-drs-maroon" : "bg-transparent",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold tracking-wide text-drs-ink/70 uppercase">
                    {categoryLabel(n.category)}
                    {isUnread && <span className="sr-only"> (unread)</span>}
                  </p>
                  <p className={cn("mt-0.5 text-sm text-drs-ink", isUnread && "font-medium")}>
                    {n.body ?? n.event_type.replace(/_/g, " ")}
                  </p>
                  <p className="mt-1 text-xs text-drs-ink/70">{when.format(new Date(n.created_at))}</p>
                </div>
                {isUnread && (
                  <button
                    type="button"
                    onClick={() => markRead(n)}
                    className="inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-sm font-medium text-drs-green hover:bg-drs-green/5"
                  >
                    Mark read
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
