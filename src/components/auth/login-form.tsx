"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { isIndianMobile, normalizeIndianMobile } from "@/lib/phone";

export type RequestOtp = (
  phone: string,
) => Promise<{ ok: boolean; data: { detail?: string; dev_otp?: string | null } }>;
export type VerifyOtp = (phone: string, otp: string) => Promise<{ ok: boolean; message?: string }>;

export function LoginForm({
  requestOtp,
  verifyOtp,
  initialError,
}: {
  requestOtp: RequestOtp;
  verifyOtp: VerifyOtp;
  initialError?: string;
}) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | undefined>(initialError);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onPhone(e: React.FormEvent) {
    e.preventDefault();
    if (!isIndianMobile(phone)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setBusy(true);
    setError(undefined);
    const r = await requestOtp(normalizeIndianMobile(phone));
    setBusy(false);
    if (!r.ok) {
      setError(r.data.detail ?? "Could not send the code. Try again.");
      return;
    }
    setDevOtp(r.data.dev_otp ?? null);
    setStep("otp");
  }

  async function onOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit code.");
      return;
    }
    setBusy(true);
    setError(undefined);
    const r = await verifyOtp(normalizeIndianMobile(phone), otp);
    setBusy(false);
    if (!r.ok) setError(r.message ?? "That code didn't work.");
  }

  return step === "phone" ? (
    <form onSubmit={onPhone} noValidate className="flex flex-col gap-5">
      <Field label="Mobile number" error={error} hint="We'll text you a 6-digit code." required>
        {(p) => (
          // The prefix + input are one bordered group so the focus ring wraps both,
          // not just the number field.
          <div
            className={cn(
              "flex overflow-hidden rounded-lg border bg-drs-white transition-colors",
              "focus-within:outline focus-within:outline-2 focus-within:outline-offset-2",
              p["aria-invalid"]
                ? "border-drs-maroon focus-within:border-drs-maroon focus-within:outline-drs-maroon"
                : "border-drs-ink/20 hover:border-drs-green/50 focus-within:border-drs-green focus-within:outline-drs-green",
            )}
          >
            <span className="inline-flex items-center border-r border-drs-ink/20 bg-drs-cream px-3 text-sm text-drs-ink/80">
              +91
            </span>
            <input
              {...p}
              className={cn(
                p.className,
                "min-w-0 flex-1 rounded-none border-0 bg-transparent hover:border-transparent focus-visible:border-transparent focus-visible:outline-none",
              )}
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoFocus
            />
          </div>
        )}
      </Field>
      <Button type="submit" loading={busy} className="w-full">
        Send code
      </Button>
    </form>
  ) : (
    <form onSubmit={onOtp} noValidate className="flex flex-col gap-5">
      <p className="text-sm text-drs-ink/80">
        Code sent to <span className="font-medium text-drs-ink">+91 {normalizeIndianMobile(phone)}</span>.
      </p>
      <Field
        label="One-time code"
        error={error}
        hint={devOtp ? `Dev mode code: ${devOtp}` : "Valid for a few minutes."}
        required
      >
        {(p) => (
          <input
            {...p}
            className={`${p.className} text-center text-lg tracking-[0.5em]`}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            autoFocus
          />
        )}
      </Field>
      <Button type="submit" loading={busy} className="w-full">
        Verify &amp; sign in
      </Button>
      <button
        type="button"
        className="min-h-11 text-sm font-medium text-drs-green underline-offset-4 hover:underline"
        onClick={() => {
          setStep("phone");
          setOtp("");
          setError(undefined);
        }}
      >
        Use a different number
      </button>
    </form>
  );
}
