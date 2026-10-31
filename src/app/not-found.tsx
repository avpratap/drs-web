import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-drs-cream px-4">
      <div className="max-w-md text-center">
        <p className="text-xs font-semibold tracking-[0.2em] text-drs-ink/70 uppercase">Page not found</p>
        <h1 className="mt-3 text-3xl font-semibold text-drs-green">This page has gone sour.</h1>
        <div aria-hidden className="mx-auto mt-4 h-0.5 w-10 rounded bg-drs-gold" />
        <p className="mt-4 text-sm leading-relaxed text-drs-ink/80">
          It may have moved, or it isn&apos;t ready yet. Let&apos;s get you back to something fresh.
        </p>
        <Link href="/" className={buttonClass("primary", "mt-8 text-sm", "pill")}>
          Back to DRS Dairy
        </Link>
      </div>
    </main>
  );
}
