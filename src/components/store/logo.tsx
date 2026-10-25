import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * DRS Dairy logo: the ivory "DRS" mark on a deep-green tile with an antique-gold keyline,
 * paired with the "DAIRY · Pure heritage" descriptor. Pass `onDark` on green surfaces so the
 * tile drops its green fill and the mark sits on the background. SVG text inherits Poppins
 * from the page.
 */
export function StoreLogo({ onDark, className }: { onDark?: boolean; className?: string }) {
  return (
    <Link
      href="/"
      aria-label="DRS Dairy — home"
      className={cn("flex min-h-11 items-center gap-2.5", className)}
    >
      <svg viewBox="0 0 48 48" aria-hidden className="size-11 shrink-0">
        <rect x="2" y="2" width="44" height="44" rx="12" fill={onDark ? "transparent" : "#0D4C3C"} />
        <rect x="5.5" y="5.5" width="37" height="37" rx="8.5" fill="none" stroke="#C5A253" strokeWidth="1.3" />
        <text
          x="24"
          y="30.5"
          textAnchor="middle"
          fill="#F4EADE"
          fontSize="13.5"
          style={{ fontWeight: 800, letterSpacing: "0.6px" }}
        >
          DRS
        </text>
      </svg>
      <span className="leading-none">
        <span
          className={cn(
            "block text-[1.0625rem] font-bold tracking-[0.16em]",
            onDark ? "text-drs-cream" : "text-drs-green",
          )}
        >
          DAIRY
        </span>
        <span
          className={cn(
            "mt-[3px] block text-[0.5625rem] font-medium tracking-[0.24em] uppercase",
            onDark ? "text-drs-cream/75" : "text-drs-ink/65",
          )}
        >
          Pure heritage
        </span>
      </span>
    </Link>
  );
}
