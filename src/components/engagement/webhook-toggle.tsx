"use client";

import { Button } from "@/components/ui/button";
import type { components } from "@/lib/api/client";
import { useApiAction } from "@/lib/use-api-action";
import { engagementActions } from "@/modules/engagement/handlers";

type Hook = components["schemas"]["WebhookOut"];

/** Enable/disable an outbound webhook in one click (toast + list refresh). */
export function ActiveToggle({ hook }: { hook: Hook }) {
  const { run, pending } = useApiAction();
  return (
    <Button
      variant="ghost"
      loading={pending}
      aria-label={`${hook.active ? "Disable" : "Enable"} webhook ${hook.event_type} → ${hook.url}`}
      className={hook.active ? "text-drs-maroon hover:bg-drs-maroon/10" : undefined}
      onClick={() =>
        run(() => engagementActions.updateWebhook(hook.id, { active: !hook.active }), {
          success: hook.active ? "Webhook disabled" : "Webhook enabled",
          invalidate: ["webhooks"],
        }).catch(() => undefined)
      }
    >
      {hook.active ? "Disable" : "Enable"}
    </Button>
  );
}
