import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginClient } from "./login-client";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <section className="on-dark relative hidden flex-col justify-between bg-drs-green p-12 text-drs-cream lg:flex">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid size-10 place-items-center rounded-full border border-drs-gold font-semibold"
          >
            D
          </span>
          <span className="text-lg font-semibold tracking-wide">DRS</span>
        </div>
        <div>
          <p className="text-xs tracking-[0.3em] text-drs-cream/75 uppercase">Admin console</p>
          <h1 className="mt-4 max-w-md text-4xl leading-tight font-semibold">
            Heritage dairy, run with care.
          </h1>
          <div aria-hidden className="mt-6 h-0.5 w-16 bg-drs-gold" />
        </div>
        <p className="text-sm text-drs-cream/70">Authorised staff only.</p>
      </section>
      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="text-lg font-semibold text-drs-green">DRS Admin</span>
            <div aria-hidden className="mt-2 h-0.5 w-10 bg-drs-gold" />
          </div>
          <h2 className="text-2xl font-semibold text-drs-green">Sign in</h2>
          <p className="mt-1 mb-8 text-sm text-drs-ink/75">Use your registered admin mobile number.</p>
          <div className="rounded-xl border border-drs-ink/10 bg-drs-white p-6 shadow-sm">
            <Suspense>
              <LoginClient />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
