"use client";

import { useNotification } from "@refinedev/core";
import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/browser";
import { unwrap } from "@/lib/api/resource";
import { todayIST } from "@/lib/forms";
import { useApiAction } from "@/lib/use-api-action";

export type ExportKind = "orders" | "payments" | "users" | "invoices";

/** Download one of the backend's admin CSV exports (auth flows through the BFF). */
export async function downloadCsv(kind: ExportKind): Promise<{ truncated: boolean }> {
  let truncated = false;
  const blob = await unwrap(
    api.GET("/api/v1/admin/exports/{kind}.csv", { params: { path: { kind } }, parseAs: "blob" }).then((r) => {
      truncated = r.response.headers.get("X-Export-Truncated") === "true";
      return r as { data?: Blob; error?: unknown; response: Response };
    }),
  );
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: `drs-${kind}-${todayIST()}.csv`,
  });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return { truncated };
}

export function ExportCsvButton({ kind, label = "Export CSV" }: { kind: ExportKind; label?: string }) {
  const { run, pending } = useApiAction();
  const { open } = useNotification();
  return (
    <Button
      variant="secondary"
      loading={pending}
      onClick={async () => {
        const r = await run(() => downloadCsv(kind)).catch(() => undefined);
        if (r)
          open?.({
            type: "success",
            message: `${kind[0].toUpperCase()}${kind.slice(1)} exported`,
            description: r.truncated ? "Large export: only the most recent rows were included." : undefined,
          });
      }}
    >
      <DownloadIcon aria-hidden className="size-4" />
      {label}
    </Button>
  );
}
