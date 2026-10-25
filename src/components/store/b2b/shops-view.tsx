"use client";

import { CheckCircle2Icon, MapPinIcon, PlusIcon, StoreIcon } from "lucide-react";
import { useState } from "react";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api/browser";
import { INDIAN_STATES, PINCODE_RE } from "@/modules/store/checkout";
import { shopAddress } from "@/modules/store/b2b";
import { detailOf } from "../cart";
import { LoadError, PanelSkeleton } from "../use-load";
import { useShops } from "./shops";

type Draft = { name: string; address: string; state: string; pincode: string };
const EMPTY: Draft = { name: "", address: "", state: "", pincode: "" };
const STATE_OPTIONS = INDIAN_STATES.map((s) => ({ value: s, label: s }));

export function validateShop(d: Draft): Partial<Record<keyof Draft, string>> {
  const e: Partial<Record<keyof Draft, string>> = {};
  if (!d.name.trim()) e.name = "Enter the shop's name";
  else if (d.name.trim().length > 255) e.name = "Keep the name under 255 characters";
  if (!d.address.trim()) e.address = "Enter the delivery address";
  if (!d.state) e.state = "Choose the state";
  if (!PINCODE_RE.test(d.pincode.trim())) e.pincode = "Enter a 6-digit pincode";
  return e;
}

function AddShop({ first }: { first: boolean }) {
  const { added } = useShops();
  const [open, setOpen] = useState(first);
  const [d, setD] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const set = (k: keyof Draft) => (v: string) => setD((x) => ({ ...x, [k]: v }));

  if (!open)
    return (
      <div>
        <Button type="button" variant="secondary" className="rounded-full" onClick={() => setOpen(true)}>
          <PlusIcon aria-hidden className="size-4" /> Add a shop
        </Button>
        {result?.kind === "ok" && (
          <p role="status" className="mt-3 flex items-start gap-2 text-sm font-medium text-drs-green">
            <CheckCircle2Icon aria-hidden className="mt-0.5 size-4 shrink-0" /> {result.text}
          </p>
        )}
      </div>
    );

  return (
    <section
      aria-labelledby="add-shop-h"
      className="rounded-2xl border border-drs-ink/10 bg-drs-white p-5 shadow-sm md:p-6"
    >
      <h2 id="add-shop-h" className="text-lg font-semibold text-drs-ink">
        Add a shop
      </h2>
      <p className="mt-0.5 text-sm text-drs-ink/75">Each shop gets its own standing order and deliveries.</p>
      <form
        noValidate
        className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const errs = validateShop(d);
          setErrors(errs);
          setResult(null);
          if (Object.keys(errs).length) return;
          setBusy(true);
          try {
            const { data, error } = await api.POST("/api/v1/shops", {
              body: {
                name: d.name.trim(),
                address: d.address.trim(),
                state: d.state,
                pincode: d.pincode.trim(),
              },
            });
            if (data) {
              added(data);
              setD(EMPTY);
              setOpen(false);
              setResult({ kind: "ok", text: `${data.name} added — it's now the shop you're viewing.` });
            } else setResult({ kind: "error", text: detailOf(error) ?? "Couldn't add the shop." });
          } catch {
            setResult({ kind: "error", text: "You seem to be offline." });
          }
          setBusy(false);
        }}
      >
        <Field label="Shop name" required error={errors.name} className="md:col-span-2">
          {(p) => (
            <input
              {...p}
              value={d.name}
              onChange={(e) => set("name")(e.target.value)}
              autoComplete="organization"
            />
          )}
        </Field>
        <Field label="Delivery address" required error={errors.address} className="md:col-span-2">
          {(p) => (
            <input
              {...p}
              value={d.address}
              onChange={(e) => set("address")(e.target.value)}
              autoComplete="street-address"
            />
          )}
        </Field>
        <Field label="State" required error={errors.state}>
          {(p) => (
            <Select
              id={p.id}
              aria-describedby={p["aria-describedby"]}
              invalid={p["aria-invalid"]}
              placeholder="Choose a state"
              value={d.state}
              onChange={(v) => set("state")(String(v))}
              options={STATE_OPTIONS}
            />
          )}
        </Field>
        <Field label="Pincode" required error={errors.pincode}>
          {(p) => (
            <input
              {...p}
              inputMode="numeric"
              maxLength={6}
              value={d.pincode}
              onChange={(e) => set("pincode")(e.target.value)}
              autoComplete="postal-code"
            />
          )}
        </Field>
        <div className="flex flex-wrap gap-2 md:col-span-2">
          <Button type="submit" className="rounded-full" disabled={busy}>
            {busy ? "Adding…" : "Add shop"}
          </Button>
          {!first && (
            <Button type="button" variant="ghost" className="rounded-full" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          )}
        </div>
        {result?.kind === "error" && (
          <p role="alert" className="text-sm text-drs-maroon md:col-span-2">
            {result.text}
          </p>
        )}
      </form>
    </section>
  );
}

/** The account's shops (delivery points): which one the business pages show, and adding more. */
export function ShopsView() {
  const { shops, current, setCurrent, error } = useShops();
  if (error) return <LoadError text={error} />;
  if (!shops) return <PanelSkeleton rows={2} label="Loading shops" />;
  return (
    <div className="space-y-4">
      {shops.length > 0 && (
        <ul aria-label="Your shops" className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {shops.map((s) => {
            const isCurrent = s.id === current?.id;
            return (
              <li
                key={s.id}
                className="flex flex-col rounded-2xl border border-drs-ink/10 bg-drs-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-drs-green/10 text-drs-green"
                  >
                    <StoreIcon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-semibold text-drs-ink">
                      {s.name}
                      {s.status !== "active" && <StatusBadge status={s.status} />}
                      {isCurrent && shops.length > 1 && <Badge tone="green">Viewing</Badge>}
                    </p>
                    {shopAddress(s) && (
                      <p className="mt-0.5 flex items-start gap-1 text-sm text-drs-ink/75">
                        <MapPinIcon aria-hidden className="mt-0.5 size-3.5 shrink-0" /> {shopAddress(s)}
                      </p>
                    )}
                  </div>
                </div>
                {!isCurrent && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="mt-3 self-start rounded-full"
                    onClick={() => setCurrent(s.id)}
                  >
                    View this shop<span className="sr-only">: {s.name}</span>
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <AddShop first={!shops.length} />
    </div>
  );
}
