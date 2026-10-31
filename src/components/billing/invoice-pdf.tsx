"use client";

import { DownloadIcon, ExternalLinkIcon, FileTextIcon } from "lucide-react";
import { useState } from "react";
import { Button, buttonClass } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useApiAction } from "@/lib/use-api-action";
import { mediaUrl } from "@/lib/media";
import { insightsActions } from "@/modules/insights/handlers";

/**
 * "View PDF" for an invoice: fetches a short-lived signed PDF URL, then shows it in a Radix
 * dialog with Download / Open-in-new-tab. `resolve` lets callers first issue the invoice
 * (e.g. an order's) and return its id.
 */
export function InvoicePdfButton({
  invoiceId,
  resolve,
  label = "View PDF",
  variant = "secondary",
}: {
  invoiceId?: number;
  resolve?: () => Promise<number>;
  label?: string;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const { run, pending } = useApiAction();
  const [pdf, setPdf] = useState<{ no: string; url: string } | null>(null);

  const open = async () => {
    const r = await run(async () => {
      const id = invoiceId ?? (await resolve!());
      return insightsActions.invoicePdf(id);
    }).catch(() => undefined);
    const url = r ? mediaUrl(r.pdf_url) : null;
    if (r && url) setPdf({ no: r.invoice_no, url });
  };

  return (
    <>
      <Button variant={variant} loading={pending} onClick={open}>
        <FileTextIcon aria-hidden className="size-4" />
        {label}
      </Button>
      <Dialog open={!!pdf} onOpenChange={(o) => !o && setPdf(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Invoice {pdf?.no}</DialogTitle>
            <DialogDescription>
              GST tax invoice (PDF). The link expires after a few minutes.
            </DialogDescription>
          </DialogHeader>
          {pdf && (
            <>
              <iframe
                title={`Invoice ${pdf.no} PDF`}
                src={pdf.url}
                className="h-[min(70dvh,52rem)] w-full rounded-lg border border-drs-ink/10 bg-drs-cream/40"
              />
              <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
                <a
                  href={pdf.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass("secondary")}
                >
                  <ExternalLinkIcon aria-hidden className="size-4" />
                  Open in new tab
                </a>
                <a
                  href={pdf.url}
                  download={`${pdf.no.replace(/\//g, "_")}.pdf`}
                  className={buttonClass("primary")}
                >
                  <DownloadIcon aria-hidden className="size-4" />
                  Download PDF
                </a>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
