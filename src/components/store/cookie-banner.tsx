"use client";

import { CookieIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { consentCookie, readConsent, type CookieChoice } from "@/modules/store/consent";
import { useCart } from "./cart";

/**
 * DPDP / cookie notice: shown at the bottom of the storefront until the visitor chooses.
 * Not a modal (the page stays usable); the choice is a first-party cookie for a year.
 */
export function CookieBanner() {
  const { session } = useCart();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    // Read after mount so the static HTML never depends on the visitor's cookies.
    let live = true;
    void Promise.resolve().then(() => live && setOpen(readConsent(document.cookie) === null));
    return () => {
      live = false;
    };
  }, []);
  if (!open) return null;
  const choose = (c: CookieChoice) => {
    document.cookie = consentCookie(c, window.location.protocol === "https:");
    setOpen(false);
  };
  return (
    <section
      aria-labelledby="cookie-h"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-drs-ink/10 bg-drs-white/95 px-4 py-4 shadow-[0_-8px_24px_rgba(13,76,60,0.12)] backdrop-blur md:px-6"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:gap-6">
        <CookieIcon
          aria-hidden
          className="hidden size-6 shrink-0 text-drs-green md:block"
          strokeWidth={1.75}
        />
        <div className="min-w-0 flex-1">
          <h2 id="cookie-h" className="text-sm font-semibold text-drs-ink">
            Your data, your choice
          </h2>
          <p className="mt-0.5 text-sm text-drs-ink/75">
            We use essential cookies to keep you signed in and your cart safe. With your OK we may also use
            cookies to understand how the shop is used. Read our{" "}
            <Link href="/privacy" className="font-medium text-drs-green underline underline-offset-2">
              privacy policy
            </Link>
            {session === "customer" && (
              <>
                {" "}
                or{" "}
                <Link
                  href="/account/privacy"
                  prefetch={false}
                  className="font-medium text-drs-green underline underline-offset-2"
                >
                  manage your consents
                </Link>
              </>
            )}
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            className="rounded-full"
            onClick={() => choose("essential")}
          >
            Essential only
          </Button>
          <Button type="button" className="rounded-full" onClick={() => choose("all")}>
            Accept all
          </Button>
        </div>
      </div>
    </section>
  );
}
