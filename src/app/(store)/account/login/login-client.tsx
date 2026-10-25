"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { useCart } from "@/components/store/cart";
import { safeNext } from "@/lib/auth/zones";

const ERRORS: Record<string, string> = {
  forbidden: "Please sign in with your customer account to continue.",
};

async function post(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { detail?: string; dev_otp?: string | null };
  return { ok: res.ok, status: res.status, data };
}

/** Customer phone-OTP sign-in (store zone: customers and subscribers only). */
export function AccountLoginClient() {
  const params = useSearchParams();
  const router = useRouter();
  const cart = useCart();
  const next = safeNext(params.get("next"), "customer", "/");
  return (
    <LoginForm
      initialError={ERRORS[params.get("error") ?? ""]}
      requestOtp={(phone) => post("/api/store-auth/otp/request", { phone })}
      verifyOtp={async (phone, otp) => {
        const r = await post("/api/store-auth/otp/verify", { phone, otp });
        if (!r.ok) return { ok: false, message: r.data.detail ?? "Could not verify the code." };
        void cart.refresh(); // the header count now reflects their saved cart
        router.replace(next);
        router.refresh();
        return { ok: true };
      }}
    />
  );
}
