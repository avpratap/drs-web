import { SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { inputClass } from "./field";

/** Search box with a leading magnifier; the browser's own clear (×) decoration is hidden in CSS. */
export function SearchInput({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  return (
    <div className={cn("relative w-full", className)}>
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-drs-ink/70"
      />
      <input type="search" className={cn(inputClass, "pl-9")} {...props} />
    </div>
  );
}
