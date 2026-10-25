import Link from "next/link";
import { cn } from "@/lib/utils";

/** DRS Dairy wordmark: a gold-ringed monogram + name. `onDark` for green surfaces. */
export function StoreLogo({ onDark, className }: { onDark?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("flex min-h-11 items-center gap-2.5", className)}>
      <span
        aria-hidden
        className={cn(
          "grid size-10 place-items-center rounded-full border-[1.5px] border-drs-gold text-base font-semibold",
          onDark ? "text-drs-cream" : "bg-drs-green text-drs-cream",
        )}
      >
        D
      </span>
      <span className="leading-none">
        <span
          className={cn(
            "block text-lg font-semibold tracking-[0.08em]",
            onDark ? "text-drs-cream" : "text-drs-green",
          )}
        >
          DRS
        </span>
        <span
          className={cn(
            "mt-1 block text-[0.625rem] font-medium tracking-[0.28em] uppercase",
            onDark ? "text-drs-cream/80" : "text-drs-ink/70",
          )}
        >
          {" "}
          Dairy
        </span>
        <span className="sr-only"> home</span>
      </span>
    </Link>
  );
}
