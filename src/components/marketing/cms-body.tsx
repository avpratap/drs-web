import { sanitizeCmsHtml } from "@/lib/sanitize";
import { cn } from "@/lib/utils";

/** Render CMS HTML safely: sanitized on the server, styled with the editorial prose rules. */
export function CmsBody({ html, className }: { html: string; className?: string }) {
  return (
    <div className={cn("cms-prose", className)} dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(html) }} />
  );
}
