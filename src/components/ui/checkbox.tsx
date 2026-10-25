"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** shadcn/ui Checkbox (Radix): role="checkbox" with aria-checked, Space toggles, DRS-green check. */
function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer grid size-5 shrink-0 place-items-center rounded-[5px] border border-drs-ink/30 bg-drs-white transition-colors",
        "hover:border-drs-green focus-visible:border-drs-green",
        "data-[state=checked]:border-drs-green data-[state=checked]:bg-drs-green data-[state=checked]:text-drs-cream",
        "disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-drs-maroon",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="grid place-items-center">
        <CheckIcon className="size-3.5" strokeWidth={3} aria-hidden />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
