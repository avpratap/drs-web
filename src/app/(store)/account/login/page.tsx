import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountLoginClient } from "./login-client";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function AccountLoginPage() {
  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 md:grid-cols-2 md:items-center md:px-6 md:py-20">
      <div className="hidden md:block">
        <p className="text-xs font-semibold tracking-[0.2em] text-drs-ink/70 uppercase">Your DRS account</p>
        <h1 className="mt-3 text-4xl leading-tight font-semibold text-drs-green">Welcome back.</h1>
        <div aria-hidden className="mt-4 h-0.5 w-12 rounded bg-drs-gold" />
        <p className="mt-5 max-w-sm text-base leading-relaxed text-drs-ink/80">
          Manage your daily milk, top up your wallet and track deliveries — all with your mobile number. No
          passwords.
        </p>
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-drs-green md:hidden">Sign in</h1>
        <p className="mt-1 mb-6 text-sm text-drs-ink/75 md:hidden">Use your mobile number to continue.</p>
        <div className="rounded-2xl border border-drs-ink/10 bg-drs-white p-6 shadow-sm md:p-8">
          <h2 className="mb-6 hidden text-xl font-semibold text-drs-ink md:block">
            Sign in with your mobile
          </h2>
          <Suspense>
            <AccountLoginClient />
          </Suspense>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-drs-ink/70">
          New to DRS? Signing in creates your account. By continuing you agree to our terms and privacy
          policy.
        </p>
      </div>
    </div>
  );
}
