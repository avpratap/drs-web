"use client";

import { useState } from "react";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

/**
 * Confirm-before-acting dialog (Radix Dialog: focus-trapped, Esc/overlay to cancel, focus
 * returns to the trigger). `danger` styles both the trigger and the confirm button for
 * destructive actions. `onConfirm` may reject: the dialog then stays open for a retry.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  danger,
  onConfirm,
  pending,
  children,
}: {
  trigger: React.ReactElement;
  title: string;
  description?: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => Promise<unknown> | unknown;
  pending?: boolean;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent showClose={false} className="max-w-md">
        <DialogHeader>
          <DialogTitle className={danger ? "text-drs-maroon" : undefined}>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        <DialogFooter className="mt-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            loading={pending || busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
                setOpen(false);
              } catch {
                /* the caller reports the error (toast); keep the dialog open */
              } finally {
                setBusy(false);
              }
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
