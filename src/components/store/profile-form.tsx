"use client";

import { BadgeCheckIcon, CheckCircle2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { CheckboxField, Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api/browser";
import type { components } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { PHONE_RE } from "@/modules/store/checkout";
import { detailOf } from "./cart";

type Profile = components["schemas"]["ProfileOut"];
type Update = components["schemas"]["ProfileUpdate"];

const GENDERS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
  { value: "undisclosed", label: "Prefer not to say" },
];
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

type Draft = {
  full_name: string;
  display_name: string;
  email: string;
  alternate_phone: string;
  date_of_birth: string;
  gender: string;
  gstin: string;
  legal_name: string;
  notify_whatsapp: boolean;
  notify_sms: boolean;
  notify_email: boolean;
  notify_push: boolean;
};

const draftOf = (p: Profile): Draft => ({
  full_name: p.full_name ?? "",
  display_name: p.display_name ?? "",
  email: p.email ?? "",
  alternate_phone: p.alternate_phone ?? "",
  date_of_birth: p.date_of_birth ?? "",
  gender: p.gender ?? "",
  gstin: p.gstin ?? "",
  legal_name: p.legal_name ?? "",
  notify_whatsapp: p.notify_whatsapp,
  notify_sms: p.notify_sms,
  notify_email: p.notify_email,
  notify_push: p.notify_push,
});

export function validateProfile(d: Draft): Partial<Record<keyof Draft, string>> {
  const e: Partial<Record<keyof Draft, string>> = {};
  if (!d.full_name.trim()) e.full_name = "Enter your name";
  if (d.email.trim() && !EMAIL_RE.test(d.email.trim())) e.email = "Enter a valid email address";
  if (d.alternate_phone.trim() && !PHONE_RE.test(d.alternate_phone.replace(/\D/g, "").slice(-10)))
    e.alternate_phone = "Enter a 10-digit mobile number";
  if (d.gstin.trim() && !GSTIN_RE.test(d.gstin.trim().toUpperCase()))
    e.gstin = "Enter a valid 15-character GSTIN";
  return e;
}

/** Only the fields that changed, normalised; blanks clear optional fields. */
export function profilePatch(before: Draft, after: Draft): Update {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(after) as (keyof Draft)[]) {
    if (after[k] === before[k]) continue;
    const v = after[k];
    if (typeof v === "boolean") out[k] = v;
    else if (k === "alternate_phone") out[k] = v.trim() ? v.replace(/\D/g, "").slice(-10) : null;
    else if (k === "gstin") out[k] = v.trim() ? v.trim().toUpperCase() : null;
    else out[k] = v.trim() || null;
  }
  return out as Update;
}

function Section({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section
      aria-label={title}
      className="rounded-2xl border border-drs-ink/10 bg-drs-white p-5 shadow-sm md:p-6"
    >
      <h2 className="text-lg font-semibold text-drs-ink">{title}</h2>
      {intro && <p className="mt-0.5 text-sm text-drs-ink/75">{intro}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function ProfileForm() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [d, setD] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [status, setStatus] = useState<
    { kind: "idle" | "saving" | "saved" } | { kind: "error"; text: string }
  >({
    kind: "idle",
  });

  useEffect(() => {
    let live = true;
    void api
      .GET("/api/v1/profile")
      .then(({ data, error }) => {
        if (!live) return;
        if (data) {
          setProfile(data);
          setD(draftOf(data));
        } else setLoadError(detailOf(error) ?? "Couldn't load your profile.");
      })
      .catch(() => live && setLoadError("You seem to be offline."));
    return () => {
      live = false;
    };
  }, []);

  if (loadError)
    return (
      <p
        role="alert"
        className="rounded-2xl border border-dashed border-drs-maroon/30 bg-drs-white px-6 py-10 text-center text-sm text-drs-maroon"
      >
        {loadError}
      </p>
    );
  if (!profile || !d)
    return (
      <div aria-busy="true" aria-label="Loading your profile" className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-2xl bg-drs-ink/[0.06] motion-reduce:animate-none"
          />
        ))}
      </div>
    );

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setD((x) => (x ? { ...x, [k]: v } : x));
    if (status.kind === "saved") setStatus({ kind: "idle" });
  };
  const before = draftOf(profile);
  const patch = profilePatch(before, d);
  const dirty = Object.keys(patch).length > 0;

  return (
    <form
      noValidate
      aria-label="Your profile"
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const errs = validateProfile(d);
        setErrors(errs);
        if (Object.keys(errs).length || !dirty) return;
        setStatus({ kind: "saving" });
        try {
          const { data, error } = await api.PATCH("/api/v1/profile", { body: patch });
          if (data) {
            setProfile(data);
            setD(draftOf(data));
            setStatus({ kind: "saved" });
          } else setStatus({ kind: "error", text: detailOf(error) ?? "We couldn't save your profile." });
        } catch {
          setStatus({ kind: "error", text: "You seem to be offline. Please try again." });
        }
      }}
    >
      <Section title="Personal details">
        <Field label="Full name" required error={errors.full_name}>
          {(p) => (
            <input
              {...p}
              autoComplete="name"
              value={d.full_name}
              onChange={(e) => set("full_name", e.target.value)}
            />
          )}
        </Field>
        <Field label="What should we call you?" hint="Shown in greetings">
          {(p) => (
            <input
              {...p}
              autoComplete="nickname"
              value={d.display_name}
              onChange={(e) => set("display_name", e.target.value)}
            />
          )}
        </Field>
        <Field label="Mobile number" hint="Used to sign in — contact support to change it">
          {(p) => (
            <input {...p} readOnly value={profile.phone} className={cn(p.className, "bg-drs-cream/50")} />
          )}
        </Field>
        <Field label="Alternate mobile" error={errors.alternate_phone}>
          {(p) => (
            <input
              {...p}
              type="tel"
              inputMode="numeric"
              value={d.alternate_phone}
              onChange={(e) => set("alternate_phone", e.target.value)}
            />
          )}
        </Field>
        <Field
          label="Email"
          error={errors.email}
          hint={
            profile.email
              ? profile.email_verified
                ? undefined
                : "Not verified yet"
              : "For receipts and invoices"
          }
          className="sm:col-span-2"
        >
          {(p) => (
            <div className="relative">
              <input
                {...p}
                type="email"
                autoComplete="email"
                value={d.email}
                onChange={(e) => set("email", e.target.value)}
              />
              {profile.email && profile.email_verified && d.email === profile.email && (
                <Badge tone="green" className="absolute top-1/2 right-2 -translate-y-1/2 gap-1">
                  <BadgeCheckIcon aria-hidden className="size-3.5" /> Verified
                </Badge>
              )}
            </div>
          )}
        </Field>
        <Field label="Date of birth" hint="For a birthday treat">
          {(p) => (
            <DatePicker
              id={p.id}
              aria-describedby={p["aria-describedby"]}
              value={d.date_of_birth}
              max={new Date().toISOString().slice(0, 10)}
              clearable
              onChange={(v) => set("date_of_birth", v ?? "")}
            />
          )}
        </Field>
        <Field label="Gender">
          {(p) => (
            <Select
              id={p.id}
              placeholder="Choose"
              clearable
              emptyLabel="Not set"
              value={d.gender}
              options={GENDERS}
              onChange={(v) => set("gender", String(v))}
            />
          )}
        </Field>
      </Section>

      <Section title="Business details" intro="Optional — add your GSTIN to get B2B tax invoices.">
        <Field label="GSTIN" error={errors.gstin}>
          {(p) => (
            <input
              {...p}
              value={d.gstin}
              autoCapitalize="characters"
              className={cn(p.className, "uppercase")}
              onChange={(e) => set("gstin", e.target.value)}
            />
          )}
        </Field>
        <Field label="Legal / business name">
          {(p) => (
            <input
              {...p}
              autoComplete="organization"
              value={d.legal_name}
              onChange={(e) => set("legal_name", e.target.value)}
            />
          )}
        </Field>
      </Section>

      <Section title="Notifications" intro="Order and delivery updates. You can change these any time.">
        <CheckboxField
          label="WhatsApp messages"
          checked={d.notify_whatsapp}
          onCheckedChange={(v) => set("notify_whatsapp", v)}
        />
        <CheckboxField
          label="Text messages (SMS)"
          checked={d.notify_sms}
          onCheckedChange={(v) => set("notify_sms", v)}
        />
        <CheckboxField
          label="Email updates"
          checked={d.notify_email}
          onCheckedChange={(v) => set("notify_email", v)}
        />
        <CheckboxField
          label="App notifications"
          checked={d.notify_push}
          onCheckedChange={(v) => set("notify_push", v)}
        />
      </Section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={!dirty || status.kind === "saving"} className="rounded-full px-6">
          {status.kind === "saving" ? "Saving…" : "Save changes"}
        </Button>
        {dirty && (
          <Button
            type="button"
            variant="ghost"
            className="rounded-full"
            onClick={() => (setD(before), setErrors({}))}
          >
            Discard
          </Button>
        )}
        <p
          role="status"
          className={cn("text-sm", status.kind === "error" ? "text-drs-maroon" : "text-drs-green")}
        >
          {status.kind === "saved" && (
            <span className="inline-flex items-center gap-1.5 font-medium">
              <CheckCircle2Icon aria-hidden className="size-4" /> Profile saved
            </span>
          )}
          {status.kind === "error" && status.text}
        </p>
      </div>
    </form>
  );
}
