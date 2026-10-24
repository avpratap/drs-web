"use client";

import { useDelete, type BaseKey } from "@refinedev/core";
import { useRef } from "react";
import { Button } from "./button";

/** Destructive action behind a native <dialog> confirm (focus-trapped, Esc to close). */
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
  const ref = useRef<HTMLDialogElement>(null);
  const { mutate, mutation } = useDelete();
  return (
    <>
      <Button
        variant="ghost"
        className="text-drs-maroon hover:bg-drs-maroon/10"
        onClick={() => ref.current?.showModal()}
      >
        {label}
      </Button>
      <dialog
        ref={ref}
        aria-labelledby={`del-${resource}-${id}`}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl bg-drs-white p-6 text-drs-ink shadow-xl backdrop:bg-drs-ink/50"
      >
        <h2 id={`del-${resource}-${id}`} className="text-lg font-semibold text-drs-maroon">
          {label}?
        </h2>
        <p className="mt-2 text-sm text-drs-ink/80">{confirmText}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => ref.current?.close()}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={mutation.isPending}
            onClick={() =>
              mutate(
                { resource, id, meta },
                {
                  onSettled: () => ref.current?.close(),
                  onSuccess: () => onDone?.(),
                },
              )
            }
          >
            {label}
          </Button>
        </div>
      </dialog>
    </>
  );
}
