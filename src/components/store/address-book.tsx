"use client";

import { MapPinIcon, PencilIcon, PlusIcon, StarIcon, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { api } from "@/lib/api/browser";
import type { Address } from "@/modules/store/checkout";
import { AddressForm } from "./address-form";
import { detailOf } from "./cart";

const action =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors disabled:opacity-50";

/** Saved delivery addresses: add, edit, make default, delete. Default first, like the backend. */
export function AddressBook() {
  const [list, setList] = useState<Address[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [notice, setNotice] = useState<string>("");

  const load = async () => {
    try {
      const { data, error: e } = await api.GET("/api/v1/addresses");
      if (data) return { list: data, error: null };
      return { list: null, error: detailOf(e) ?? "Couldn't load your addresses." };
    } catch {
      return { list: null, error: "You seem to be offline." };
    }
  };
  const reload = async () => {
    const r = await load();
    setList(r.list);
    setError(r.error);
  };
  useEffect(() => {
    let live = true;
    void load().then((r) => {
      if (!live) return;
      setList(r.list);
      setError(r.error);
    });
    return () => {
      live = false;
    };
  }, []);

  async function makeDefault(a: Address) {
    setBusy(a.id);
    const { data, error: e } = await api
      .POST("/api/v1/addresses/{address_id}/default", { params: { path: { address_id: a.id } } })
      .catch(() => ({ data: undefined, error: undefined }));
    if (data) {
      setNotice(`${a.label ?? "Address"} is now your default address.`);
      await reload();
    } else setNotice(detailOf(e) ?? "Couldn't change the default address.");
    setBusy(null);
  }

  async function remove(a: Address) {
    setBusy(a.id);
    const { response } = await api
      .DELETE("/api/v1/addresses/{address_id}", { params: { path: { address_id: a.id } } })
      .catch(() => ({ response: undefined }));
    if (response?.ok) {
      setNotice("Address deleted.");
      await reload();
    } else setNotice("Couldn't delete that address. Please try again.");
    setBusy(null);
  }

  if (error)
    return (
      <p
        role="alert"
        className="rounded-2xl border border-dashed border-drs-maroon/30 bg-drs-white px-6 py-10 text-center text-sm text-drs-maroon"
      >
        {error}
      </p>
    );
  if (!list)
    return (
      <div aria-busy="true" aria-label="Loading addresses" className="grid gap-3 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-2xl bg-drs-ink/[0.06] motion-reduce:animate-none"
          />
        ))}
      </div>
    );

  return (
    <div className="space-y-4">
      <p role="status" className="sr-only">
        {notice}
      </p>
      {editing === "new" ? (
        <section
          aria-labelledby="new-address"
          className="rounded-2xl border border-drs-green/20 bg-drs-white p-5 shadow-sm md:p-6"
        >
          <h2 id="new-address" className="mb-4 text-lg font-semibold text-drs-ink">
            Add an address
          </h2>
          <AddressForm
            defaultOpen={list.length === 0}
            onCancel={() => setEditing(null)}
            onSaved={async () => {
              setEditing(null);
              setNotice("Address saved.");
              await reload();
            }}
          />
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-drs-green px-5 text-sm font-semibold text-drs-cream shadow-sm hover:bg-drs-green/90"
        >
          <PlusIcon aria-hidden className="size-4" /> Add an address
        </button>
      )}

      {list.length === 0 && editing !== "new" ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-drs-ink/20 bg-drs-white/70 px-6 py-12 text-center">
          <MapPinIcon aria-hidden className="size-9 text-drs-green" strokeWidth={1.5} />
          <h2 className="mt-3 text-lg font-semibold text-drs-ink">No saved addresses</h2>
          <p className="mt-1 text-sm text-drs-ink/75">Add one now and checkout takes seconds.</p>
        </div>
      ) : (
        <ul aria-label="Saved addresses" className="grid gap-3 md:grid-cols-2">
          {list.map((a) => {
            const name = a.label ?? a.contact_name ?? "Address";
            return (
              <li
                key={a.id}
                className="rounded-2xl border border-drs-ink/10 bg-drs-white p-4 shadow-sm md:p-5"
                aria-busy={busy === a.id || undefined}
              >
                {editing === a.id ? (
                  <AddressForm
                    address={a}
                    onCancel={() => setEditing(null)}
                    onSaved={async () => {
                      setEditing(null);
                      setNotice("Address updated.");
                      await reload();
                    }}
                  />
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-drs-ink">{a.contact_name ?? name}</span>
                      {a.label && <Badge>{a.label}</Badge>}
                      {a.is_default && <Badge tone="green">Default</Badge>}
                    </div>
                    <p className="mt-1.5 text-sm text-drs-ink/80">
                      {[a.line1, a.line2, a.landmark && `Near ${a.landmark}`].filter(Boolean).join(", ")}
                      <br />
                      {a.city}, {a.state} {a.pincode}
                    </p>
                    {a.contact_phone && <p className="text-sm text-drs-ink/70">{a.contact_phone}</p>}
                    <div className="mt-3 -ml-3 flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(a.id)}
                        className={`${action} text-drs-green hover:bg-drs-green/5`}
                        aria-label={`Edit ${name}`}
                      >
                        <PencilIcon aria-hidden className="size-4" /> <span aria-hidden>Edit</span>
                      </button>
                      {!a.is_default && (
                        <button
                          type="button"
                          disabled={busy === a.id}
                          onClick={() => makeDefault(a)}
                          className={`${action} text-drs-green hover:bg-drs-green/5`}
                          aria-label={`Make default: ${name}`}
                        >
                          <StarIcon aria-hidden className="size-4" /> <span aria-hidden>Make default</span>
                        </button>
                      )}
                      <ConfirmDialog
                        trigger={
                          <button
                            type="button"
                            disabled={busy === a.id}
                            className={`${action} text-drs-maroon hover:bg-drs-maroon/5`}
                            aria-label={`Delete ${name}`}
                          >
                            <Trash2Icon aria-hidden className="size-4" /> <span aria-hidden>Delete</span>
                          </button>
                        }
                        title="Delete this address?"
                        description={`${a.line1}, ${a.city} ${a.pincode} will be removed from your saved addresses.`}
                        confirmLabel="Delete address"
                        danger
                        onConfirm={() => remove(a)}
                      />
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
