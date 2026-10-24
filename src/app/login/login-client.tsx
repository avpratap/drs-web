"use client";

import { useLogin } from "@refinedev/core";
import { useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { requestOtp } from "@/providers/auth-provider";

const ERRORS: Record<string, string> = {
  forbidden: "This dashboard is for DRS admins only.",
};

export function LoginClient() {
  const params = useSearchParams();
  const { mutateAsync: login } = useLogin<{ phone: string; otp: string; redirectTo?: string }>();
  const next = params.get("next");
  const redirectTo = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return (
    <LoginForm
      initialError={ERRORS[params.get("error") ?? ""]}
      requestOtp={requestOtp}
      verifyOtp={async (phone, otp) => {
        const r = await login({ phone, otp, redirectTo });
        return { ok: r.success, message: r.error?.message };
      }}
    />
  );
}
