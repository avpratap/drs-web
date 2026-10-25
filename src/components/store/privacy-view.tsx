"use client";

import { DownloadIcon, ShieldCheckIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api/browser";
import { cn } from "@/lib/utils";
import { detailOf, useCart } from "./cart";
import { LoadError, PanelSkeleton, useLoad } from "./use-load";

/** The consents the backend records (ConsentIn.purpose), in the order shoppers think about them. */
export const CONSENTS = [
  {
    purpose: "data_processing",
    title: "Processing my data to run my account",
    body: "Needed to take orders, deliver and bill you. To withdraw it, delete your account below.",
    required: true,
  },
  { purpose: "whatsapp_optin", title: "WhatsApp updates", body: "Order and delivery messages on WhatsApp." },
  {
    purpose: "marketing_push",
    title: "Offers in the app",
    body: "Occasional offers and new products as notifications.",
  },
  { purpose: "marketing_email", title: "Offers by email", body: "Our newsletter and seasonal offers." },
  { purpose: "marketing_sms", title: "Offers by SMS", body: "Short offer messages to your mobile." },
  {
    purpose: "marketing_whatsapp",
    title: "Offers on WhatsApp",
    body: "Offers and new products on WhatsApp.",
  },
] as const;
type Purpose = (typeof CONSENTS)[number]["purpose"];

function Consents() {
  const consents = useLoad(() => api.GET("/api/v1/consents"), "Couldn't load your choices.");
  const [busy, setBusy] = useState<Purpose | null>(null);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);

  if (consents.error) return <LoadError text={consents.error} />;
  if (!consents.data) return <PanelSkeleton rows={1} label="Loading your choices" />;
  const current = consents.data;

  const toggle = async (purpose: Purpose, granted: boolean) => {
    setBusy(purpose);
    setMsg(null);
    const action = granted ? "granted" : "withdrawn";
    try {
      const { data, error } = await api.POST("/api/v1/consents", { body: { purpose, action } });
      if (data) {
        consents.setData({ ...current, [purpose]: action });
        const title = CONSENTS.find((c) => c.purpose === purpose)!.title;
        setMsg({ text: `${title}: ${granted ? "turned on" : "turned off"}.` });
      } else setMsg({ text: detailOf(error) ?? "Couldn't save that choice.", error: true });
    } catch {
      setMsg({ text: "You seem to be offline.", error: true });
    }
    setBusy(null);
  };

  return (
    <section
      aria-labelledby="consent-h"
      className="rounded-2xl border border-drs-ink/10 bg-drs-white p-5 shadow-sm md:p-6"
    >
      <h2 id="consent-h" className="text-lg font-semibold text-drs-ink">
        Your consents
      </h2>
      <p className="mt-0.5 text-sm text-drs-ink/75">
        Under India&apos;s Digital Personal Data Protection Act you choose how we use your data. Changes apply
        right away.
      </p>
      <ul className="mt-4 divide-y divide-drs-ink/10">
        {CONSENTS.map((c) => {
          const on = current[c.purpose] === "granted";
          const id = `consent-${c.purpose}`;
          return (
            <li key={c.purpose} className="flex items-start gap-3 py-3">
              <Checkbox
                id={id}
                checked={on}
                disabled={("required" in c && c.required) || busy === c.purpose}
                onCheckedChange={(v) => toggle(c.purpose, v === true)}
                aria-describedby={`${id}-d`}
                className="mt-0.5"
              />
              <div className="min-w-0">
                <label htmlFor={id} className="text-sm font-medium text-drs-ink">
                  {c.title}
                </label>
                <p id={`${id}-d`} className="text-sm text-drs-ink/70">
                  {c.body}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      <p
        role={msg?.error ? "alert" : "status"}
        className={cn("mt-2 min-h-5 text-sm", msg?.error ? "text-drs-maroon" : "text-drs-green")}
      >
        {msg?.text}
      </p>
    </section>
  );
}

function ExportData() {
  const [state, setState] = useState<{ kind: "idle" | "busy" | "done" } | { kind: "error"; text: string }>({
    kind: "idle",
  });
  return (
    <section
      aria-labelledby="export-h"
      className="rounded-2xl border border-drs-ink/10 bg-drs-white p-5 shadow-sm md:p-6"
    >
      <h2 id="export-h" className="text-lg font-semibold text-drs-ink">
        Download your data
      </h2>
      <p className="mt-0.5 text-sm text-drs-ink/75">
        A copy of everything we hold about you — profile, addresses, orders and more — as a JSON file.
      </p>
      <Button
        type="button"
        variant="secondary"
        className="mt-4 rounded-full"
        disabled={state.kind === "busy"}
        onClick={async () => {
          setState({ kind: "busy" });
          try {
            const { data, error } = await api.GET("/api/v1/account/export");
            if (!data)
              return setState({ kind: "error", text: detailOf(error) ?? "Couldn't prepare your data." });
            const url = URL.createObjectURL(
              new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
            );
            const a = document.createElement("a");
            a.href = url;
            a.download = `drs-my-data-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 10_000);
            setState({ kind: "done" });
          } catch {
            setState({ kind: "error", text: "You seem to be offline." });
          }
        }}
      >
        <DownloadIcon aria-hidden className="size-4" />
        {state.kind === "busy" ? "Preparing…" : "Download my data"}
      </Button>
      <p
        role={state.kind === "error" ? "alert" : "status"}
        className={cn("mt-2 min-h-5 text-sm", state.kind === "error" ? "text-drs-maroon" : "text-drs-green")}
      >
        {state.kind === "done"
          ? "Your data file has been downloaded."
          : state.kind === "error"
            ? state.text
            : ""}
      </p>
    </section>
  );
}

type EraseStep =
  | { kind: "intro" }
  | { kind: "code"; sending?: boolean }
  | { kind: "erasing" }
  | { kind: "done"; retained: string }
  | { kind: "error"; text: string; back: "intro" | "code" };

/** Right to erasure: explain, send an OTP to the account phone, confirm with it. Irreversible. */
function DeleteAccount() {
  const router = useRouter();
  const { refresh } = useCart();
  const otpId = useId();
  const profile = useLoad(() => api.GET("/api/v1/profile"), "");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<EraseStep>({ kind: "intro" });
  const [otp, setOtp] = useState("");
  const phone = profile.data?.phone;
  const masked = phone ? `${phone.slice(0, 2)}••••••${phone.slice(-2)}` : "your mobile";

  const sendCode = async () => {
    if (!phone) return;
    setStep({ kind: "code", sending: true });
    const res = await fetch(`${window.location.origin}/api/store-auth/otp/request`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone }),
    }).catch(() => null);
    if (!res?.ok) {
      const body = (await res?.json().catch(() => ({}))) as { detail?: string } | undefined;
      return setStep({
        kind: "error",
        text: body?.detail ?? "Couldn't send the code. Try again shortly.",
        back: "intro",
      });
    }
    setStep({ kind: "code" });
  };

  const erase = async () => {
    if (!/^\d{6}$/.test(otp))
      return setStep({ kind: "error", text: "Enter the 6-digit code.", back: "code" });
    setStep({ kind: "erasing" });
    try {
      const { data, error } = await api.POST("/api/v1/account/erase", { body: { otp } });
      if (!data)
        return setStep({
          kind: "error",
          text: detailOf(error) ?? "We couldn't delete your account.",
          back: "code",
        });
      setStep({ kind: "done", retained: data.retained });
      await fetch(`${window.location.origin}/api/store-auth/logout`, {
        method: "POST",
        credentials: "same-origin",
      }).catch(() => undefined);
      await refresh();
    } catch {
      setStep({ kind: "error", text: "You seem to be offline.", back: "code" });
    }
  };

  return (
    <section
      aria-labelledby="delete-h"
      className="rounded-2xl border border-drs-maroon/25 bg-drs-white p-5 shadow-sm md:p-6"
    >
      <h2 id="delete-h" className="text-lg font-semibold text-drs-maroon">
        Delete your account
      </h2>
      <p className="mt-0.5 text-sm text-drs-ink/75">
        Permanently removes your personal details. Tax invoices and payment records are kept as the law
        requires.
      </p>
      <Button
        type="button"
        variant="danger"
        className="mt-4 rounded-full"
        onClick={() => {
          setStep({ kind: "intro" });
          setOtp("");
          setOpen(true);
        }}
      >
        <Trash2Icon aria-hidden className="size-4" /> Delete my account
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (step.kind === "done" && !o) {
            router.replace("/");
            router.refresh();
          }
          if (step.kind !== "erasing") setOpen(o);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {step.kind === "done" ? "Your account is deleted" : "Delete your DRS account?"}
            </DialogTitle>
            <DialogDescription>
              {step.kind === "done"
                ? "Your personal details have been removed and you've been signed out."
                : "This can't be undone. Active subscriptions stop, your wallet and points are forfeited, and you'll be signed out."}
            </DialogDescription>
          </DialogHeader>

          {step.kind === "intro" && (
            <ul className="list-disc space-y-1 pl-5 text-sm text-drs-ink/80">
              <li>Your name, contact details and addresses are erased.</li>
              <li>Invoices and payment records are retained for tax law, without your profile.</li>
              <li>We&apos;ll send a code to {masked} to confirm it&apos;s you.</li>
            </ul>
          )}
          {(step.kind === "code" ||
            step.kind === "erasing" ||
            (step.kind === "error" && step.back === "code")) && (
            <div>
              <label htmlFor={otpId} className="text-sm font-medium text-drs-ink">
                Code sent to {masked}
              </label>
              <input
                id={otpId}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="mt-1.5 block h-11 w-40 rounded-lg border border-drs-ink/20 bg-drs-white px-3 font-mono text-lg tracking-[0.3em] hover:border-drs-green/50 focus-visible:border-drs-green"
              />
            </div>
          )}
          {step.kind === "done" && (
            <p className="flex items-start gap-2 rounded-xl bg-drs-cream/70 p-3 text-sm text-drs-ink/80">
              <ShieldCheckIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-drs-green" />{" "}
              {step.retained}
            </p>
          )}
          {step.kind === "error" && (
            <p role="alert" className="text-sm text-drs-maroon">
              {step.text}
            </p>
          )}

          <DialogFooter>
            {step.kind === "done" ? (
              <Button
                type="button"
                onClick={() => (router.replace("/"), router.refresh())}
                className="rounded-full"
              >
                Go to the home page
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  disabled={step.kind === "erasing"}
                  className="rounded-full"
                >
                  Keep my account
                </Button>
                {step.kind === "intro" || (step.kind === "error" && step.back === "intro") ? (
                  <Button
                    type="button"
                    variant="danger"
                    onClick={sendCode}
                    disabled={!phone}
                    className="rounded-full"
                  >
                    Send code
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="danger"
                    onClick={erase}
                    disabled={step.kind === "erasing" || ("sending" in step && step.sending)}
                    className="rounded-full"
                  >
                    {step.kind === "erasing" ? "Deleting…" : "Delete permanently"}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export function PrivacyView() {
  return (
    <div className="space-y-4">
      <Consents />
      <ExportData />
      <DeleteAccount />
    </div>
  );
}
