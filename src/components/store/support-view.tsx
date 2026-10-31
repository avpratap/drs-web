"use client";

import { ChevronRightIcon, LifeBuoyIcon, SendIcon } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api/browser";
import type { components } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { detailOf } from "./cart";
import { LoadError, PanelSkeleton, useLoad } from "./use-load";
import { EmptyState } from "./empty-state";

type Ticket = components["schemas"]["TicketOut"];

export const TICKET_CATEGORIES = [
  { value: "order", label: "An order" },
  { value: "delivery", label: "A delivery" },
  { value: "payment", label: "Payment or wallet" },
  { value: "product", label: "Product quality" },
  { value: "other", label: "Something else" },
];

export function ticketStatus(status: string): { label: string; tone: Tone } {
  switch (status) {
    case "open":
      return { label: "Open", tone: "sky" };
    case "pending":
      return { label: "Awaiting you", tone: "gold" };
    case "resolved":
      return { label: "Resolved", tone: "green" };
    case "closed":
      return { label: "Closed", tone: "neutral" };
    default:
      return { label: status, tone: "neutral" };
  }
}

function NewTicket({ onCreated, onCancel }: { onCreated: (t: Ticket) => void; onCancel: () => void }) {
  const [category, setCategory] = useState("order");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<{ subject?: string; body?: string }>({});
  const [state, setState] = useState<{ busy: boolean; error: string | null }>({ busy: false, error: null });
  return (
    <form
      noValidate
      aria-label="New support request"
      className="grid gap-4 rounded-2xl border border-drs-green/20 bg-drs-white p-5 shadow-sm md:p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        const errs = {
          subject: subject.trim() ? undefined : "Add a short subject",
          body: body.trim().length >= 10 ? undefined : "Tell us a little more (at least 10 characters)",
        };
        setErrors(errs);
        if (errs.subject || errs.body) return;
        setState({ busy: true, error: null });
        try {
          const { data, error } = await api.POST("/api/v1/support/tickets", {
            body: { category, subject: subject.trim(), body: body.trim() },
          });
          if (data) return onCreated(data);
          setState({ busy: false, error: detailOf(error) ?? "We couldn't send your request." });
        } catch {
          setState({ busy: false, error: "You seem to be offline. Please try again." });
        }
      }}
    >
      <h2 className="text-lg font-semibold text-drs-ink">New request</h2>
      <Field label="What's it about?">
        {(p) => (
          <Select
            id={p.id}
            value={category}
            options={TICKET_CATEGORIES}
            onChange={(v) => setCategory(String(v))}
          />
        )}
      </Field>
      <Field label="Subject" required error={errors.subject}>
        {(p) => <input {...p} maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} />}
      </Field>
      <Field
        label="Message"
        required
        error={errors.body}
        hint="Include the order number if it's about an order."
      >
        {(p) => (
          <textarea
            {...p}
            rows={5}
            maxLength={5000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className={cn(p.className, "min-h-32")}
          />
        )}
      </Field>
      {state.error && (
        <p role="alert" className="text-sm text-drs-maroon">
          {state.error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={state.busy} className="rounded-full px-6">
          {state.busy ? "Sending…" : "Send request"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} className="rounded-full">
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** Support requests: open a new one, see all (latest first), each links to its thread. */
export function SupportList() {
  const list = useLoad(() => api.GET("/api/v1/support/tickets"), "Couldn't load your requests.");
  const [composing, setComposing] = useState(false);
  const [created, setCreated] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {composing ? (
        <NewTicket
          onCancel={() => setComposing(false)}
          onCreated={async (t) => {
            setComposing(false);
            setCreated(t.ticket_no);
            await list.reload();
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setComposing(true)}
          className={buttonClass("primary", "px-5 text-sm", "pill")}
        >
          <LifeBuoyIcon aria-hidden className="size-4" /> New request
        </button>
      )}
      {created && (
        <p role="status" className="rounded-xl bg-drs-green/10 px-4 py-3 text-sm font-medium text-drs-green">
          Request {created} sent. We usually reply within a few hours.
        </p>
      )}
      {list.error ? (
        <LoadError text={list.error} />
      ) : !list.data ? (
        <PanelSkeleton rows={2} label="Loading requests" />
      ) : list.data.length === 0 ? (
        <EmptyState
          icon={LifeBuoyIcon}
          title="No requests yet"
          body="We're here if anything isn't right with an order or a delivery."
        />
      ) : (
        <ul aria-label="Your requests" className="space-y-3">
          {list.data.map((t) => {
            const st = ticketStatus(t.status);
            const last = t.messages[t.messages.length - 1];
            return (
              <li key={t.id}>
                <Link
                  href={`/account/support/${t.id}`}
                  className="group flex items-center gap-3 rounded-2xl border border-drs-ink/10 bg-drs-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-drs-ink group-hover:text-drs-green">
                        {t.subject}
                      </span>
                      <Badge tone={st.tone}>{st.label}</Badge>
                    </span>
                    <span className="mt-1 block text-xs text-drs-ink/70">{t.ticket_no}</span>
                    {last && (
                      <span className="mt-1 block truncate text-sm text-drs-ink/75">
                        {last.sender_role === "customer" ? "You: " : "DRS: "}
                        {last.body}
                      </span>
                    )}
                  </span>
                  <ChevronRightIcon aria-hidden className="size-5 shrink-0 text-drs-ink/50" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** One request: the conversation and a reply box. */
export function SupportThread({ id }: { id: number }) {
  const ticket = useLoad(
    () => api.GET("/api/v1/support/tickets/{ticket_id}", { params: { path: { ticket_id: id } } }),
    "Couldn't load this request.",
  );
  const replyId = useId();
  const [reply, setReply] = useState("");
  const [state, setState] = useState<{ busy: boolean; error: string | null }>({ busy: false, error: null });

  if (ticket.error) return <LoadError text={ticket.error} />;
  if (!ticket.data) return <PanelSkeleton rows={2} label="Loading request" />;
  const t = ticket.data;
  const st = ticketStatus(t.status);
  const closed = t.status === "closed";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-drs-ink">{t.subject}</h2>
        <Badge tone={st.tone}>{st.label}</Badge>
        <span className="text-sm text-drs-ink/70">{t.ticket_no}</span>
      </div>
      <ol aria-label="Conversation" className="space-y-3">
        {t.messages.map((m) => {
          const mine = m.sender_role === "customer";
          return (
            <li key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm sm:max-w-[75%]",
                  mine
                    ? "rounded-br-md bg-drs-green text-drs-cream"
                    : "rounded-bl-md border border-drs-ink/10 bg-drs-white text-drs-ink",
                )}
              >
                <p className={cn("text-xs font-semibold", mine ? "text-drs-cream/85" : "text-drs-green")}>
                  {mine ? "You" : "DRS support"}
                </p>
                <p className="mt-1 whitespace-pre-line">{m.body}</p>
                {m.attachment_url && (
                  <a
                    href={m.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block underline"
                  >
                    Attachment<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {closed ? (
        <p className="rounded-xl bg-drs-ink/5 px-4 py-3 text-sm text-drs-ink/80">
          This request is closed. Open a new one if you need more help.
        </p>
      ) : (
        <form
          className="rounded-2xl border border-drs-ink/10 bg-drs-white p-4 shadow-sm"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!reply.trim()) return setState({ busy: false, error: "Write a message first." });
            setState({ busy: true, error: null });
            try {
              const { data, error } = await api.POST("/api/v1/support/tickets/{ticket_id}/messages", {
                params: { path: { ticket_id: id } },
                body: { body: reply.trim() },
              });
              if (data) {
                ticket.setData(data);
                setReply("");
                setState({ busy: false, error: null });
              } else setState({ busy: false, error: detailOf(error) ?? "We couldn't send your reply." });
            } catch {
              setState({ busy: false, error: "You seem to be offline. Please try again." });
            }
          }}
        >
          <label htmlFor={replyId} className="text-sm font-medium text-drs-ink">
            Reply
          </label>
          <textarea
            id={replyId}
            rows={3}
            maxLength={5000}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            aria-invalid={!!state.error || undefined}
            aria-describedby={state.error ? `${replyId}-err` : undefined}
            className="mt-1.5 block min-h-24 w-full rounded-lg border border-drs-ink/20 bg-drs-white px-3 py-2 text-sm text-drs-ink hover:border-drs-green/50 focus-visible:border-drs-green aria-[invalid=true]:border-drs-maroon"
          />
          {state.error && (
            <p id={`${replyId}-err`} role="alert" className="mt-1.5 text-sm text-drs-maroon">
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={state.busy} className="mt-3 rounded-full px-5">
            <SendIcon aria-hidden className="size-4" /> {state.busy ? "Sending…" : "Send reply"}
          </Button>
        </form>
      )}
    </div>
  );
}
