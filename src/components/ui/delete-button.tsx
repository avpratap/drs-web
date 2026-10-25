"use client";

import { useDelete, type BaseKey } from "@refinedev/core";
import { Button } from "./button";
import { ConfirmDialog } from "./confirm-dialog";

/** Destructive delete behind a Radix confirm dialog. */
export function DeleteButton({
  resource,
  id,
  label = "Delete",
  confirmText,
  meta,
  onDone,
}: {
  resource: string;
  id: BaseKey;
  label?: string;
  confirmText: string;
  meta?: Record<string, unknown>;
  onDone?: () => void;
}) {
  const { mutateAsync, mutation } = useDelete();
  return (
    <ConfirmDialog
      trigger={
        <Button variant="ghost" className="text-drs-maroon hover:bg-drs-maroon/10">
          {label}
        </Button>
      }
      title={`${label}?`}
      description={confirmText}
      confirmLabel={label}
      danger
      pending={mutation.isPending}
      onConfirm={async () => {
        await mutateAsync({ resource, id, meta });
        onDone?.();
      }}
    />
  );
}
