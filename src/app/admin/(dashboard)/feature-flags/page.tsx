"use client";

import { useList } from "@refinedev/core";
import { ActionDialog } from "@/components/resource/action-dialog";
import { Card, PageHeader } from "@/components/ui/card";
import type { components } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import { useApiAction } from "@/lib/use-api-action";
import { systemActions } from "@/modules/system/handlers";

type Flag = components["schemas"]["FeatureFlagOut"] & { id: string };

function FlagSwitch({ flag }: { flag: Flag }) {
  const { run, pending } = useApiAction();
  const toggle = () =>
    run(
      () =>
        systemActions.upsertFlag({ key: flag.key, enabled: !flag.enabled, description: flag.description }),
      {
        success: `${flag.key} ${flag.enabled ? "disabled" : "enabled"}`,
        invalidate: ["feature-flags"],
      },
    ).catch(() => undefined);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={flag.enabled}
      aria-label={`${flag.key}`}
      disabled={pending}
      onClick={toggle}
      className="group inline-flex min-h-11 items-center gap-3 disabled:opacity-60"
    >
      <span
        aria-hidden
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          flag.enabled ? "bg-drs-green" : "bg-drs-ink/25",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-drs-white shadow transition-transform",
            flag.enabled && "translate-x-5",
          )}
        />
      </span>
      <span className="w-8 text-sm font-medium">{flag.enabled ? "On" : "Off"}</span>
    </button>
  );
}

export default function FeatureFlagsPage() {
  const { result, query } = useList<Flag>({ resource: "feature-flags", pagination: { mode: "off" } });
  const flags = [...result.data].sort((a, b) => a.key.localeCompare(b.key));
  return (
    <>
      <PageHeader
        title="Feature flags"
        description="Turn features on or off for every app and website user instantly."
        actions={
          <ActionDialog
            label="New flag"
            variant="primary"
            defaultValues={{ enabled: false }}
            fields={[
              {
                name: "key",
                label: "Key",
                required: true,
                maxLength: 64,
                pattern: { value: /^[a-z0-9_.-]+$/, message: "Lowercase letters, digits, _ . - only" },
                placeholder: "e.g. checkout.upi_intent",
              },
              { name: "description", label: "Description", maxLength: 255 },
              { name: "enabled", label: "Enabled", type: "checkbox" },
            ]}
            onConfirm={(v) =>
              systemActions.upsertFlag({
                key: v.key as string,
                enabled: !!v.enabled,
                description: (v.description as string) ?? null,
              })
            }
            success="Flag saved"
            invalidate={["feature-flags"]}
          />
        }
      />
      {query.isLoading ? (
        <Card>Loading…</Card>
      ) : query.error ? (
        <Card>{query.error.message}</Card>
      ) : flags.length === 0 ? (
        <Card>No feature flags yet.</Card>
      ) : (
        <ul className="divide-y divide-drs-ink/10 rounded-xl border border-drs-ink/10 bg-drs-white shadow-sm">
          {flags.map((f) => (
            <li
              key={f.key}
              className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-mono text-sm font-semibold text-drs-ink">{f.key}</p>
                {f.description && <p className="mt-0.5 text-sm text-drs-ink/75">{f.description}</p>}
              </div>
              <FlagSwitch flag={f} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
