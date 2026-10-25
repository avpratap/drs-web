"use client";

import { DownloadIcon, ExternalLinkIcon, FileTextIcon } from "lucide-react";
import { useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { api } from "@/lib/api/browser";
import { cn } from "@/lib/utils";
import { mediaUrl } from "@/modules/delivery/actions";
import { detailOf } from "./cart";

/**
 * GST invoice for a paid order: issues it if needed (POST /orders/{id}/invoice, idempotent),
 * then fetches a short-lived signed PDF link (GET /invoices/{id}/pdf) to view or download.
 */
export function InvoiceLink({ orderId }: { orderId: number }) {
  const [state, setState] = useState<
    { kind: "idle" | "busy" } | { kind: "ready"; no: string; url: string } | { kind: "error"; text: string }
  >({ kind: "idle" });

  async function fetchPdf() {
    setState({ kind: "busy" });
    try {
      const inv = await api.POST("/api/v1/orders/{order_id}/invoice", {
        params: { path: { order_id: orderId } },
      });
      if (!inv.data)
        return setState({ kind: "error", text: detailOf(inv.error) ?? "The invoice isn't ready yet." });
      const pdf = await api.GET("/api/v1/invoices/{invoice_id}/pdf", {
        params: { path: { invoice_id: inv.data.id } },
      });
      const url = mediaUrl(pdf.data?.pdf_url);
      if (!pdf.data || !url)
        return setState({ kind: "error", text: detailOf(pdf.error) ?? "Couldn't open the invoice." });
      setState({ kind: "ready", no: pdf.data.invoice_no, url });
    } catch {
      setState({ kind: "error", text: "You seem to be offline. Please try again." });
    }
  }

  if (state.kind === "ready")
    return (
      <div className="mt-4 rounded-xl bg-drs-cream/60 p-3 text-sm">
        <p className="font-medium text-drs-ink">Invoice {state.no}</p>
        <p className="text-xs text-drs-ink/70">The link works for a few minutes.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href={state.url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("secondary", "rounded-full")}
          >
            <ExternalLinkIcon aria-hidden className="size-4" /> View PDF
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          <a
            href={state.url}
            download={`${state.no.replace(/\//g, "_")}.pdf`}
            className={buttonClass("ghost", "rounded-full")}
          >
            <DownloadIcon aria-hidden className="size-4" /> Download
          </a>
        </div>
      </div>
    );
  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={fetchPdf}
        disabled={state.kind === "busy"}
        className={cn(buttonClass("secondary", "w-full rounded-full"))}
      >
        <FileTextIcon aria-hidden className="size-4" />
        {state.kind === "busy" ? "Preparing invoice…" : "GST invoice (PDF)"}
      </button>
      {state.kind === "error" && (
        <p role="alert" className="mt-2 text-sm text-drs-maroon">
          {state.text}
        </p>
      )}
    </div>
  );
}
