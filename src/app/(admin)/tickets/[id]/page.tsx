"use client";

import { useOne } from "@refinedev/core";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { PriorityBadge } from "@/components/customers/badges";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, DescriptionList, PageHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { BackLink } from "@/components/ui/links";
import type { components } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import { humanize } from "@/lib/format";
import { useApiAction } from "@/lib/use-api-action";
import { mediaUrl } from "@/modules/delivery/actions";
import { customerActions } from "@/modules/customers/handlers";
import { OPTIONS } from "@/modules/options";

type Ticket = components["schemas"]["TicketOut"];

export default function TicketShowPage() {
  const { id } = useParams<{ id: string }>();
  const { result: t, query } = useOne<Ticket>({ resource: "tickets", id });
  const { run, pending } = useApiAction();
  const form = useForm<{ body: string }>({ defaultValues: { body: "" } });

  if (query.isLoading) return <Card>Loading…</Card>;
  if (query.error || !t) return <Card>{query.error?.message ?? "Ticket not found."}</Card>;

  const reply = form.handleSubmit(async ({ body }) => {
    try {
      await run(() => customerActions.replyTicket(t.id, { body: body.trim() }), {
        success: "Reply sent",
        invalidate: ["tickets"],
      });
      form.reset({ body: "" });
    } catch {
      /* toast shown */
    }
  });

  return (
    <>
      <PageHeader
        eyebrow={<BackLink href="/tickets">Support tickets</BackLink>}
        title={t.subject}
        description={t.ticket_no}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section aria-labelledby="thread" className="order-2 lg:order-1">
          <h2 id="thread" className="sr-only">
            Conversation
          </h2>
          <ol className="flex flex-col gap-3">
            {t.messages.map((m) => {
              const staff = m.sender_role === "admin";
              const att = mediaUrl(m.attachment_url);
              return (
                <li
                  key={m.id}
                  className={cn(
                    "max-w-[90%] rounded-xl border p-4 text-sm",
                    staff
                      ? "self-end border-drs-green/20 bg-drs-green/5"
                      : "self-start border-drs-ink/10 bg-drs-white",
                  )}
                >
                  <p className="mb-1 text-xs font-semibold text-drs-ink/70">
                    {staff ? "DRS support" : humanize(m.sender_role)}
                  </p>
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  {att && (
                    <a
                      href={att}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs font-medium text-drs-green underline"
                    >
                      View attachment<span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  )}
                </li>
              );
            })}
          </ol>
          <form onSubmit={reply} noValidate className="mt-6">
            <Card>
              <Field label="Reply to customer" error={form.formState.errors.body?.message} required>
                {(p) => (
                  <textarea
                    {...p}
                    rows={4}
                    {...form.register("body", {
                      validate: (v) => v.trim().length > 0 || "Write a reply first",
                      maxLength: { value: 5000, message: "Max 5000 characters" },
                    })}
                  />
                )}
              </Field>
              <div className="mt-4 flex justify-end">
                <Button type="submit" loading={pending}>
                  Send reply
                </Button>
              </div>
            </Card>
          </form>
        </section>
        <aside className="order-1 lg:order-2">
          <Card>
            <DescriptionList
              items={[
                { label: "Status", value: <StatusBadge status={t.status} /> },
                { label: "Priority", value: <PriorityBadge priority={t.priority} /> },
                { label: "Category", value: humanize(t.category) },
              ]}
            />
            <div className="mt-4">
              <label htmlFor="ticket-status" className="mb-1.5 block text-sm font-medium">
                Change status
              </label>
              <select
                id="ticket-status"
                value={t.status}
                disabled={pending}
                onChange={(e) =>
                  run(() => customerActions.setTicketStatus(t.id, e.target.value), {
                    success: `Ticket ${humanize(e.target.value).toLowerCase()}`,
                    invalidate: ["tickets"],
                  }).catch(() => undefined)
                }
                className="min-h-11 w-full rounded-lg border border-drs-ink/20 bg-drs-white px-3 text-sm"
              >
                {OPTIONS.ticketStatus.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}
