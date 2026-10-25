"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * shadcn/ui-style Toast (Radix): announced via a live region, swipe/Esc to dismiss, pauses
 * on hover/focus. Wrap the app (or a subtree) in <ToastProvider> + <ToastViewport />.
 */
const ToastProvider = ToastPrimitive.Provider;

function ToastViewport({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Viewport>) {
  return (
    <ToastPrimitive.Viewport
      className={cn(
        "fixed inset-x-4 bottom-4 z-[100] flex max-h-dvh flex-col-reverse gap-2 outline-none md:inset-x-auto md:right-6 md:bottom-6 md:w-96",
        className,
      )}
      {...props}
    />
  );
}

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border bg-card p-4 pr-10 text-sm shadow-lg shadow-drs-green/10 transition-all data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-2 data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=end]:animate-out data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none",
  {
    variants: {
      variant: {
        // A thin gold rule is the sparing accent; red-ish maroon only for errors.
        default: "border-drs-green/15 border-l-4 border-l-drs-gold text-drs-ink",
        success: "border-drs-green/20 border-l-4 border-l-drs-green text-drs-ink",
        error: "border-drs-maroon/30 border-l-4 border-l-drs-maroon text-drs-ink",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Toast({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Root> & VariantProps<typeof toastVariants>) {
  return <ToastPrimitive.Root className={cn(toastVariants({ variant }), className)} {...props} />;
}

function ToastTitle({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Title>) {
  return <ToastPrimitive.Title className={cn("font-semibold text-drs-green", className)} {...props} />;
}

function ToastDescription({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Description>) {
  return <ToastPrimitive.Description className={cn("text-drs-ink/80", className)} {...props} />;
}

function ToastAction({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Action>) {
  return (
    <ToastPrimitive.Action
      className={cn(
        "inline-flex min-h-9 shrink-0 items-center rounded-md border border-drs-green/30 px-3 text-sm font-medium text-drs-green hover:border-drs-green",
        className,
      )}
      {...props}
    />
  );
}

function ToastClose({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Close>) {
  return (
    <ToastPrimitive.Close
      className={cn(
        "absolute top-2 right-2 grid size-8 place-items-center rounded-md text-drs-ink/70 hover:bg-accent hover:text-accent-foreground",
        className,
      )}
      aria-label="Dismiss"
      {...props}
    >
      <XIcon className="size-4" aria-hidden />
    </ToastPrimitive.Close>
  );
}

export {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  toastVariants,
};
