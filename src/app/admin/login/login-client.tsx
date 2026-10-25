"use client";

import { useLogin } from "@refinedev/core";
import { useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { ADMIN_HOME } from "@/components/layout/nav";
import { safeNext } from "@/lib/auth/zones";
import { requestOtp } from "@/providers/auth-provider";

const ERRORS: Record<string, string> = {
  forbidden: "This dashboard is for DRS admins only.",
};

export function LoginClient() {
  const params = useSearchParams();
  const { mutateAsync: login } = useLogin<{ phone: string; otp: string; redirectTo?: string }>();
  const next = params.get("next");
  // Only admin paths: never bounce an admin into the storefront or off-site.
  const redirectTo = safeNext(next, "admin", ADMIN_HOME);
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
