"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckboxField, Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api/browser";
import { INDIAN_STATES, PHONE_RE, PINCODE_RE, type Address } from "@/modules/store/checkout";
import { detailOf } from "./cart";

type Draft = {
  contact_name: string;
  contact_phone: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  label: string;
  is_default: boolean;
};
const EMPTY: Draft = {
  contact_name: "",
  contact_phone: "",
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  label: "Home",
  is_default: true,
};
const STATE_OPTIONS = INDIAN_STATES.map((s) => ({ value: s, label: s }));
const LABEL_OPTIONS = ["Home", "Work", "Other"].map((s) => ({ value: s, label: s }));

/** Client-side checks that mirror the backend (it re-validates). */
export function validateAddress(d: Draft): Partial<Record<keyof Draft, string>> {
  const e: Partial<Record<keyof Draft, string>> = {};
  if (!d.contact_name.trim()) e.contact_name = "Enter the name to deliver to";
  if (!PHONE_RE.test(d.contact_phone.replace(/\D/g, "").slice(-10)))
    e.contact_phone = "Enter a 10-digit mobile number";
  if (!d.line1.trim()) e.line1 = "Enter the house/flat and street";
  if (!d.city.trim()) e.city = "Enter the city";
  if (!d.state) e.state = "Choose the state";
  if (!PINCODE_RE.test(d.pincode.trim())) e.pincode = "Enter a 6-digit pincode";
  return e;
}

const draftFrom = (a: Address): Draft => ({
  contact_name: a.contact_name ?? "",
  contact_phone: a.contact_phone ?? "",
  line1: a.line1,
  line2: a.line2 ?? "",
  landmark: a.landmark ?? "",
  city: a.city,
  state: a.state,
  pincode: a.pincode,
  label: a.label ?? "Home",
  is_default: a.is_default,
});

/** Add a delivery address, or edit `address` in place (PATCH). */
export function AddressForm({
  address,
  onSaved,
  onCancel,
  defaultOpen,
}: {
  address?: Address;
  onSaved: (a: Address) => void;
  onCancel?: () => void;
  defaultOpen?: boolean;
}) {
  const [d, setD] = useState<Draft>(() =>
    address ? draftFrom(address) : { ...EMPTY, is_default: !!defaultOpen },
  );
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  return (
    <form
      noValidate
      aria-label={address ? "Edit address" : "New delivery address"}
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const errs = validateAddress(d);
        setErrors(errs);
        if (Object.keys(errs).length) return;
        setSaving(true);
        setFormError(null);
        try {
          const body = {
            label: d.label || null,
            contact_name: d.contact_name.trim(),
            contact_phone: d.contact_phone.replace(/\D/g, "").slice(-10),
            line1: d.line1.trim(),
            line2: d.line2.trim() || null,
            landmark: d.landmark.trim() || null,
            city: d.city.trim(),
            state: d.state,
            pincode: d.pincode.trim(),
            country: "IN",
            is_default: d.is_default,
          };
          const { data, error } = address
            ? await api.PATCH("/api/v1/addresses/{address_id}", {
                params: { path: { address_id: address.id } },
                body,
              })
            : await api.POST("/api/v1/addresses", { body });
          if (data) onSaved(data);
          else setFormError(detailOf(error) ?? "We couldn't save this address.");
        } catch {
          setFormError("You seem to be offline. Please try again.");
        }
        setSaving(false);
      }}
    >
      <Field label="Full name" required error={errors.contact_name}>
        {(p) => (
          <input
            {...p}
            autoComplete="name"
            value={d.contact_name}
            onChange={(e) => set("contact_name", e.target.value)}
          />
        )}
      </Field>
      <Field label="Mobile number" required error={errors.contact_phone} hint="For the delivery partner">
        {(p) => (
          <input
            {...p}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={d.contact_phone}
            onChange={(e) => set("contact_phone", e.target.value)}
          />
        )}
      </Field>
      <Field label="House / flat, street" required error={errors.line1} className="sm:col-span-2">
        {(p) => (
          <input
            {...p}
            autoComplete="address-line1"
            value={d.line1}
            onChange={(e) => set("line1", e.target.value)}
          />
        )}
      </Field>
      <Field label="Area / locality" error={errors.line2}>
        {(p) => (
          <input
            {...p}
            autoComplete="address-line2"
            value={d.line2}
            onChange={(e) => set("line2", e.target.value)}
          />
        )}
      </Field>
      <Field label="Landmark">
        {(p) => <input {...p} value={d.landmark} onChange={(e) => set("landmark", e.target.value)} />}
      </Field>
      <Field label="City" required error={errors.city}>
        {(p) => (
          <input
            {...p}
            autoComplete="address-level2"
            value={d.city}
            onChange={(e) => set("city", e.target.value)}
          />
        )}
      </Field>
      <Field label="Pincode" required error={errors.pincode}>
        {(p) => (
          <input
            {...p}
            inputMode="numeric"
            maxLength={6}
            autoComplete="postal-code"
            value={d.pincode}
            onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))}
          />
        )}
      </Field>
      <Field label="State" required error={errors.state}>
        {(p) => (
          <Select
            id={p.id}
            aria-describedby={p["aria-describedby"]}
            invalid={p["aria-invalid"]}
            placeholder="Choose state"
            value={d.state}
            options={STATE_OPTIONS}
            onChange={(v) => set("state", String(v))}
          />
        )}
      </Field>
      <Field label="Save as">
        {(p) => (
          <Select
            id={p.id}
            value={d.label}
            options={LABEL_OPTIONS}
            onChange={(v) => set("label", String(v))}
          />
        )}
      </Field>
      <div className="sm:col-span-2">
        <CheckboxField
          label="Make this my default address"
          checked={d.is_default}
          onCheckedChange={(v) => set("is_default", v)}
        />
      </div>
      {formError && (
        <p role="alert" className="text-sm text-drs-maroon sm:col-span-2">
          {formError}
        </p>
      )}
      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <Button type="submit" disabled={saving} className="rounded-full px-6">
          {saving ? "Saving…" : address ? "Save changes" : "Save address"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} className="rounded-full">
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
