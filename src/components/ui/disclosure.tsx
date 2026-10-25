import { ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** <details>/<summary> with an on-brand chevron instead of the browser's disclosure triangle. */
export function Disclosure({
  summary,
  children,
  className,
}: {
  summary: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <details className={cn("group", className)}>
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-drs-green [&::-webkit-details-marker]:hidden">
        <ChevronRightIcon
          aria-hidden
          className="size-4 transition-transform duration-150 group-open:rotate-90"
          strokeWidth={2}
        />
        {summary}
      </summary>
      {children}
    </details>
  );
}
