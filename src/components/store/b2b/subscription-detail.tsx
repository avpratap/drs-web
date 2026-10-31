"use client";

import { CheckCircle2Icon, PauseIcon, PlayIcon, PlusIcon, Trash2Icon, XCircleIcon } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { inputClass } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api/browser";
import type { components } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  cadenceLabel,
  dayLabel,
  dayLines,
  draftOf,
  hasErrors,
  itemsPayload,
  newLine,
  shopAddress,
  upcomingDates,
  validateLines,
  WEEKDAYS,
  type DayLine,
  type Frequency,
  type LineDraft,
  type LineErrors,
  type Plan,
  type SubscriptionDetail,
} from "@/modules/store/b2b";
import { detailOf } from "../cart";
import { useAttemptKey } from "../use-attempt-key";
import { packLabel } from "../product-card";
import { LoadError, PanelSkeleton, useLoad } from "../use-load";
import { StartStandingOrder } from "./subscriptions-view";
import { useShops } from "./shops";

type Product = components["schemas"]["ProductOut"];
type Products = Map<number, Product>;

const card = "rounded-2xl border border-drs-ink/10 bg-drs-white p-5 shadow-sm md:p-6";
const productName = (products: Products, id: number) => products.get(id)?.name ?? `Product #${id}`;
const amount = (products: Products, id: number, qty: number) => {
  const p = products.get(id);
  return p ? packLabel(qty, p.uom) : String(qty);
};

type Outcome = { kind: "ok" | "error"; text: string } | null;

function Notice({ outcome }: { outcome: Outcome }) {
  if (!outcome) return null;
  return outcome.kind === "ok" ? (
    <p role="status" className="mt-3 flex items-start gap-2 text-sm font-medium text-drs-green">
      <CheckCircle2Icon aria-hidden className="mt-0.5 size-4 shrink-0" /> {outcome.text}
    </p>
  ) : (
    <p role="alert" className="mt-3 text-sm text-drs-maroon">
      {outcome.text}
    </p>
  );
}

async function call<T>(
  run: () => Promise<{ data?: T; error?: unknown }>,
  fallback: string,
): Promise<{ data?: T; error?: string }> {
  try {
    const { data, error } = await run();
    return data !== undefined ? { data } : { error: detailOf(error) ?? fallback };
  } catch {
    return { error: "You seem to be offline. Please try again." };
  }
}

/* ------------------------------------------------------------------------------------------ */

function StatusPanel({ sub, onChange }: { sub: SubscriptionDetail; onChange: () => Promise<void> }) {
  const { shops } = useShops();
  const shop = shops?.find((s) => s.id === sub.shop_id);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const attempt = useAttemptKey();

  const act = async (action: "pause" | "resume" | "cancel", done: string) => {
    setBusy(true);
    setOutcome(null);
    const path = `/api/v1/subscriptions/{sub_id}/${action}` as const;
    const r = await call(
      () =>
        attempt.send(action, (headers) => api.POST(path, { params: { path: { sub_id: sub.id } }, headers })),
      "Couldn't update the standing order.",
    );
    if (r.error) {
      setOutcome({ kind: "error", text: r.error });
      setBusy(false);
      throw new Error(r.error); // keeps a confirm dialog open
    }
    await onChange();
    setOutcome({ kind: "ok", text: done });
    setBusy(false);
  };

  return (
    <section aria-labelledby="status-h" className={card}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="status-h" className="flex flex-wrap items-center gap-2 text-lg font-semibold text-drs-ink">
            {shop?.name ?? `Shop #${sub.shop_id}`} <StatusBadge status={sub.status} />
          </h2>
          <p className="mt-0.5 text-sm text-drs-ink/75">
            {shop && shopAddress(shop) ? `${shopAddress(shop)} · ` : ""}
            Since {formatDate(sub.start_date)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {sub.status === "active" && (
            <Button
              type="button"
              variant="secondary"
              className="rounded-full"
              disabled={busy}
              onClick={() =>
                act("pause", "Paused — nothing is delivered until you resume.").catch(() => undefined)
              }
            >
              <PauseIcon aria-hidden className="size-4" /> Pause
            </Button>
          )}
          {sub.status === "paused" && (
            <Button
              type="button"
              className="rounded-full"
              disabled={busy}
              onClick={() =>
                act("resume", "Resumed — deliveries restart from the next open day.").catch(() => undefined)
              }
            >
              <PlayIcon aria-hidden className="size-4" /> Resume
            </Button>
          )}
          {sub.status !== "cancelled" && (
            <ConfirmDialog
              danger
              title="Cancel this standing order?"
              description="Deliveries stop for good. Tomorrow's order may already be fixed if the cutoff has passed. You can start a new standing order for this shop later."
              confirmLabel="Cancel standing order"
              pending={busy}
              onConfirm={() => act("cancel", "Cancelled — no further deliveries.")}
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full text-drs-maroon"
                  disabled={busy}
                >
                  <XCircleIcon aria-hidden className="size-4" /> Cancel
                </Button>
              }
            />
          )}
        </div>
      </div>
      {sub.status === "cancelled" && shop && (
        <div className="mt-4">
          <StartStandingOrder shop={shop} label="Restart standing order" />
        </div>
      )}
      <Notice outcome={outcome} />
    </section>
  );
}

/* ------------------------------------------------------------------------------------------ */

const FREQ_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "daily", label: "Every day" },
  { value: "alternate", label: "Every few days" },
  { value: "weekly", label: "On chosen weekdays" },
];

function LineEditor({
  line,
  errors,
  products,
  disabled,
  onChange,
  onRemove,
}: {
  line: LineDraft;
  errors: LineErrors;
  products: Products;
  disabled: boolean;
  onChange: (l: LineDraft) => void;
  onRemove: () => void;
}) {
  const id = useId();
  const p = products.get(line.product_id);
  const name = productName(products, line.product_id);
  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium text-drs-ink">
          {name}
          {p && <span className="ml-1.5 text-sm font-normal text-drs-ink/70">sold in {p.uom}</span>}
        </p>
        <Button
          type="button"
          variant="ghost"
          className="-mt-2 -mr-2 shrink-0 rounded-full text-drs-maroon"
          disabled={disabled}
          onClick={onRemove}
          aria-label={`Remove ${name}`}
        >
          <Trash2Icon aria-hidden className="size-4" />
          <span className="sr-only sm:not-sr-only">Remove</span>
        </Button>
      </div>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-q`} className="text-sm font-medium text-drs-ink">
            Quantity per delivery{p ? ` (${p.uom})` : ""}
          </label>
          <input
            id={`${id}-q`}
            inputMode="decimal"
            value={line.qty}
            disabled={disabled}
            onChange={(e) => onChange({ ...line, qty: e.target.value })}
            aria-invalid={!!errors.qty || undefined}
            aria-describedby={errors.qty ? `${id}-qe` : p ? `${id}-qh` : undefined}
            className={inputClass}
          />
          {errors.qty ? (
            <p id={`${id}-qe`} role="alert" className="text-xs font-medium text-drs-maroon">
              {errors.qty}
            </p>
          ) : (
            p &&
            Number(line.qty) > 0 && (
              <p id={`${id}-qh`} className="text-xs text-drs-ink/70">
                {packLabel(Number(line.qty), p.uom)} each delivery
              </p>
            )
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <span id={`${id}-fl`} className="text-sm font-medium text-drs-ink">
            How often
          </span>
          <Select
            id={`${id}-f`}
            aria-labelledby={`${id}-fl ${id}-f`}
            disabled={disabled}
            value={line.frequency}
            onChange={(v) => onChange({ ...line, frequency: v as Frequency })}
            options={FREQ_OPTIONS}
          />
        </div>
      </div>
      {line.frequency === "alternate" && (
        <div className="mt-3 flex max-w-xs flex-col gap-1.5">
          <label htmlFor={`${id}-i`} className="text-sm font-medium text-drs-ink">
            Deliver every … days
          </label>
          <input
            id={`${id}-i`}
            inputMode="numeric"
            value={line.interval}
            disabled={disabled}
            onChange={(e) => onChange({ ...line, interval: e.target.value })}
            aria-invalid={!!errors.interval || undefined}
            aria-describedby={errors.interval ? `${id}-ie` : undefined}
            className={inputClass}
          />
          {errors.interval && (
            <p id={`${id}-ie`} role="alert" className="text-xs font-medium text-drs-maroon">
              {errors.interval}
            </p>
          )}
        </div>
      )}
      {line.frequency === "weekly" && (
        <fieldset className="mt-3" aria-describedby={errors.days ? `${id}-de` : undefined}>
          <legend className="text-sm font-medium text-drs-ink">Delivery days</legend>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
            {WEEKDAYS.map((d) => (
              <label key={d.n} className="flex min-h-11 items-center gap-2 text-sm text-drs-ink">
                <Checkbox
                  checked={line.days.includes(d.n)}
                  disabled={disabled}
                  aria-label={d.long}
                  onCheckedChange={(on) =>
                    onChange({
                      ...line,
                      days: on
                        ? [...line.days, d.n].sort((a, b) => a - b)
                        : line.days.filter((x) => x !== d.n),
                    })
                  }
                />
                <span aria-hidden>{d.short}</span>
              </label>
            ))}
          </div>
          {errors.days && (
            <p id={`${id}-de`} role="alert" className="text-xs font-medium text-drs-maroon">
              {errors.days}
            </p>
          )}
        </fieldset>
      )}
    </li>
  );
}

function StandingOrderEditor({
  sub,
  products,
  onSaved,
}: {
  sub: SubscriptionDetail;
  products: Products;
  onSaved: (s: SubscriptionDetail) => void;
}) {
  const active = (sub.items ?? []).filter((i) => i.active);
  const [lines, setLines] = useState<LineDraft[]>(() => active.map(draftOf));
  const [errors, setErrors] = useState<LineErrors[]>([]);
  const [adding, setAdding] = useState<number | "">("");
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const attempt = useAttemptKey();
  const locked = sub.status === "cancelled";

  const addable = [...products.values()].filter(
    (p) => p.is_subscribable && !lines.some((l) => l.product_id === p.id),
  );
  const set = (i: number, l: LineDraft) => setLines((ls) => ls.map((x, j) => (j === i ? l : x)));

  return (
    <section aria-labelledby="standing-h" className={card}>
      <h2 id="standing-h" className="text-lg font-semibold text-drs-ink">
        Standing order
      </h2>
      <p className="mt-0.5 text-sm text-drs-ink/75">
        What we bring by default. Changes apply from the next day that isn&apos;t yet fixed by the evening
        cutoff.
      </p>
      <form
        className="mt-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const errs = validateLines(lines);
          setErrors(errs);
          setOutcome(null);
          if (hasErrors(errs)) return;
          setBusy(true);
          const body = itemsPayload(lines);
          const r = await call(
            () =>
              attempt.send(body, (headers) =>
                api.PUT("/api/v1/subscriptions/{sub_id}/items", {
                  params: { path: { sub_id: sub.id } },
                  body,
                  headers,
                }),
              ),
            "Couldn't save the standing order.",
          );
          setBusy(false);
          if (r.error) return setOutcome({ kind: "error", text: r.error });
          onSaved(r.data!);
          setOutcome({ kind: "ok", text: "Standing order saved." });
        }}
      >
        {lines.length ? (
          <ul aria-label="Standing order lines" className="divide-y divide-drs-ink/10">
            {lines.map((l, i) => (
              <LineEditor
                key={l.product_id}
                line={l}
                errors={errors[i] ?? {}}
                products={products}
                disabled={busy || locked}
                onChange={(next) => set(i, next)}
                onRemove={() => {
                  setLines((ls) => ls.filter((_, j) => j !== i));
                  setErrors((es) => es.filter((_, j) => j !== i));
                }}
              />
            ))}
          </ul>
        ) : (
          <p className="rounded-xl bg-drs-cream/60 px-4 py-3 text-sm text-drs-ink/75">
            No products yet — add what this shop needs below.
          </p>
        )}
        {!locked && addable.length > 0 && (
          <div className="mt-4 flex flex-col gap-2 border-t border-drs-ink/10 pt-4 sm:flex-row sm:items-end">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span id="add-product-l" className="text-sm font-medium text-drs-ink">
                Add a product
              </span>
              <Select
                id="add-product"
                aria-labelledby="add-product-l add-product"
                placeholder="Choose a product"
                value={adding}
                onChange={(v) => setAdding(v === "" ? "" : Number(v))}
                options={addable.map((p) => ({
                  value: p.id,
                  label: `${p.name} (${packLabel(p.pack_size, p.uom)})`,
                }))}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              className="shrink-0 rounded-full"
              disabled={adding === ""}
              onClick={() => {
                if (adding === "") return;
                setLines((ls) => [...ls, newLine(adding)]);
                setAdding("");
              }}
            >
              <PlusIcon aria-hidden className="size-4" /> Add
            </Button>
          </div>
        )}
        {!locked && (
          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="submit" className="rounded-full" disabled={busy}>
              {busy ? "Saving…" : "Save standing order"}
            </Button>
          </div>
        )}
        <Notice outcome={outcome} />
      </form>
    </section>
  );
}

/* ------------------------------------------------------------------------------------------ */

function DayLineRow({
  line,
  date,
  subId,
  products,
  onSaved,
}: {
  line: DayLine;
  date: string;
  subId: number;
  products: Products;
  onSaved: (text: string) => Promise<void>;
}) {
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [qty, setQty] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pid = line.item.product_id;
  const name = productName(products, pid);
  const attempt = useAttemptKey();

  const save = async (q: number, text: string) => {
    setBusy(true);
    setError(null);
    const body = { product_id: pid, for_date: date, override_qty: q };
    const r = await call(
      () =>
        attempt.send(body, (headers) =>
          api.POST("/api/v1/subscriptions/{sub_id}/overrides", {
            params: { path: { sub_id: subId } },
            body,
            headers,
          }),
        ),
      "Couldn't change this day.",
    );
    setBusy(false);
    if (r.error) return setError(r.error);
    setEditing(false);
    await onSaved(text);
  };

  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="font-medium text-drs-ink">{name}</p>
          <p className="text-sm text-drs-ink/75">
            {line.state === "none" ? (
              "No delivery"
            ) : (
              <>
                <span className="font-semibold text-drs-ink tabular-nums">
                  {amount(products, pid, line.qty)}
                </span>
                {line.state === "changed" && (
                  <span className="text-drs-ink/75">
                    {" "}
                    · usually {amount(products, pid, line.item.default_qty)}
                  </span>
                )}
              </>
            )}
            <span className="text-drs-ink/70"> · {cadenceLabel(line.item)}</span>
          </p>
        </div>
        {!editing && (
          <div className="flex flex-wrap gap-2">
            {line.state !== "none" && (
              <Button
                type="button"
                variant="ghost"
                className="rounded-full"
                disabled={busy}
                aria-label={`Skip ${name} on ${dayLabel(date)}`}
                onClick={() => save(0, `${name} skipped for ${dayLabel(date)}.`)}
              >
                Skip
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              className="rounded-full"
              disabled={busy}
              aria-label={`${line.state === "none" ? "Add" : "Change"} ${name} on ${dayLabel(date)}`}
              onClick={() => {
                setQty(String(line.qty || line.item.default_qty || ""));
                setEditing(true);
              }}
            >
              {line.state === "none" ? "Add" : "Change"}
            </Button>
          </div>
        )}
      </div>
      {editing && (
        <form
          className="mt-2 flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const q = Number(qty);
            if (qty.trim() === "" || !Number.isFinite(q) || q < 0 || q > 100_000)
              return setError("Enter a quantity (0 skips the day)");
            void save(q, `${name} set to ${amount(products, pid, q)} for ${dayLabel(date)}.`);
          }}
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-q`} className="text-sm font-medium text-drs-ink">
              Quantity on {dayLabel(date)}
              {products.get(pid) ? ` (${products.get(pid)!.uom})` : ""}
            </label>
            <input
              id={`${id}-q`}
              inputMode="decimal"
              value={qty}
              autoFocus
              onChange={(e) => setQty(e.target.value)}
              aria-invalid={!!error || undefined}
              aria-describedby={error ? `${id}-e` : undefined}
              className={cn(inputClass, "w-40")}
            />
          </div>
          <Button type="submit" className="rounded-full" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
          <Button type="button" variant="ghost" className="rounded-full" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </form>
      )}
      {error && (
        <p id={`${id}-e`} role="alert" className="mt-1.5 text-sm text-drs-maroon">
          {error}
        </p>
      )}
    </li>
  );
}

function DayPlan({ sub, products }: { sub: SubscriptionDetail; products: Products }) {
  const dates = upcomingDates(14);
  const [date, setDate] = useState(dates[0]);
  const [note, setNote] = useState("");
  const plan = useDayPlan(sub.id, date, planVersion(sub));
  const lines = dayLines(sub.items ?? [], plan.data);

  return (
    <section aria-labelledby="days-h" className={card}>
      <h2 id="days-h" className="text-lg font-semibold text-drs-ink">
        Day by day
      </h2>
      <p className="mt-0.5 text-sm text-drs-ink/75">
        Skip or change a single day. Tomorrow can be changed until the evening cutoff.
      </p>
      <div
        role="group"
        aria-label="Delivery date"
        className="no-scrollbar -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1"
      >
        {dates.map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={d === date}
            onClick={() => {
              setDate(d);
              setNote("");
            }}
            className={cn(
              "min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors",
              d === date
                ? "border-drs-green bg-drs-green text-drs-cream"
                : "border-drs-ink/15 bg-drs-white text-drs-ink hover:border-drs-green/50",
            )}
          >
            {dayLabel(d)}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {sub.status !== "active" ? (
          <p className="rounded-xl bg-drs-cream/60 px-4 py-3 text-sm text-drs-ink/75">
            {sub.status === "paused"
              ? "Paused — nothing is delivered until you resume."
              : "This standing order is cancelled."}
          </p>
        ) : plan.error ? (
          <LoadError text={plan.error} />
        ) : plan.loading ? (
          <div
            aria-busy="true"
            aria-label="Loading the day's deliveries"
            className="h-24 animate-pulse rounded-xl bg-drs-ink/[0.06] motion-reduce:animate-none"
          />
        ) : lines.length ? (
          <ul aria-label={`Deliveries on ${dayLabel(date)}`} className="divide-y divide-drs-ink/10">
            {lines.map((l) => (
              <DayLineRow
                key={`${date}-${l.item.product_id}`}
                line={l}
                date={date}
                subId={sub.id}
                products={products}
                onSaved={async (text) => {
                  await plan.reload();
                  setNote(text);
                }}
              />
            ))}
          </ul>
        ) : (
          <p className="rounded-xl bg-drs-cream/60 px-4 py-3 text-sm text-drs-ink/75">
            Add products to the standing order first.
          </p>
        )}
        <p role="status" className="mt-3 text-sm font-medium text-drs-green empty:hidden">
          {note}
        </p>
      </div>
    </section>
  );
}

/** GET /subscriptions/{id}/plan?date= — re-read whenever the date changes. */
/** Changes whenever the standing order or its status does, so the plan for a date refetches. */
export const planVersion = (sub: Pick<SubscriptionDetail, "status" | "items">) =>
  `${sub.status}|${(sub.items ?? [])
    .filter((i) => i.active)
    .map(
      (i) =>
        `${i.product_id}:${i.default_qty}:${i.frequency}:${i.interval_days ?? ""}:${i.days_of_week ?? ""}`,
    )
    .join(",")}`;

function useDayPlan(subId: number, date: string, version: string) {
  const key = `${subId}:${date}:${version}`;
  const [state, setState] = useState<{ key: string; data: Plan | null; error: string | null }>({
    key: "",
    data: null,
    error: null,
  });
  const fetchPlan = useCallback(
    () =>
      call(
        () =>
          api.GET("/api/v1/subscriptions/{sub_id}/plan", {
            params: { path: { sub_id: subId }, query: { date } },
          }),
        "Couldn't load that day.",
      ).then((r) => ({ key, data: r.data ?? null, error: r.error ?? null })),
    [key, subId, date],
  );
  // `version` is part of `key`, so a changed standing order refetches the same date.
  useEffect(() => {
    let live = true;
    void fetchPlan().then((s) => live && setState(s));
    return () => {
      live = false;
    };
  }, [fetchPlan]);
  const reload = useCallback(async () => setState(await fetchPlan()), [fetchPlan]);
  const current = state.key === key;
  return {
    data: current ? state.data : null,
    error: current ? state.error : null,
    loading: !current,
    reload,
  };
}

/* ------------------------------------------------------------------------------------------ */

/** One shop's standing order: status + pause/resume/cancel, the default lines, and per-day changes. */
export function SubscriptionDetailView({ id }: { id: number }) {
  const sub = useLoad(
    () => api.GET("/api/v1/subscriptions/{sub_id}", { params: { path: { sub_id: id } } }),
    "Couldn't load this standing order.",
  );
  const catalogue = useLoad(
    () => api.GET("/api/v1/products", { params: { query: { limit: 100 } } }),
    "Couldn't load the product list.",
  );
  const error = sub.error ?? catalogue.error;
  if (error) return <LoadError text={error} />;
  if (!sub.data || !catalogue.data) return <PanelSkeleton rows={3} label="Loading standing order" />;
  const products: Products = new Map(catalogue.data.map((p) => [p.id, p]));
  return (
    <div className="space-y-4">
      <StatusPanel sub={sub.data} onChange={sub.reload} />
      <StandingOrderEditor
        key={`${sub.data.id}:${sub.data.status}`}
        sub={sub.data}
        products={products}
        onSaved={(s) => sub.setData(s)}
      />
      {/* Keyed by the subscription only: saving the standing order refetches the day's plan
          (see planVersion) without remounting, so the chosen date stays selected. */}
      <DayPlan key={sub.data.id} sub={sub.data} products={products} />
    </div>
  );
}
