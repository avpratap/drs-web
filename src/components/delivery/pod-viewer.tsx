/* eslint-disable @next/next/no-img-element -- signed, short-lived URLs on arbitrary storage hosts; next/image can't optimise them */
import { Card } from "@/components/ui/card";
import type { components } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";
import { mediaUrl } from "@/modules/delivery/actions";

type POD = components["schemas"]["PODOut"];

function Media({ url, alt, label }: { url: string | null | undefined; alt: string; label: string }) {
  const src = mediaUrl(url);
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-xs font-medium tracking-wide text-drs-ink/70 uppercase">{label}</figcaption>
      {src ? (
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-lg border border-drs-ink/10 bg-drs-cream/40"
        >
          <img src={src} alt={alt} loading="lazy" className="aspect-[4/3] w-full object-contain" />
          <span className="sr-only"> (opens full size in a new tab)</span>
        </a>
      ) : (
        <div className="grid aspect-[4/3] place-items-center rounded-lg border border-dashed border-drs-ink/20 text-sm text-drs-ink/70">
          Not captured
        </div>
      )}
    </figure>
  );
}

/** Proof of delivery: photo + signature + who/when/where. */
export function PodViewer({ pods }: { pods: POD[] }) {
  if (!pods.length) {
    return <Card>No proof of delivery captured for this stop.</Card>;
  }
  return (
    <div className="flex flex-col gap-4">
      {pods.map((p) => (
        <Card key={p.id}>
          <div className="grid gap-4 md:grid-cols-2">
            <Media
              url={p.photo_url}
              label="Photo"
              alt={`Delivery photo${p.recipient_name ? ` — received by ${p.recipient_name}` : ""}`}
            />
            <Media
              url={p.signature_url}
              label="Signature"
              alt={`Recipient signature${p.recipient_name ? ` of ${p.recipient_name}` : ""}`}
            />
          </div>
          <dl className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
            <div>
              <dt className="text-xs text-drs-ink/65">Received by</dt>
              <dd>{p.recipient_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-drs-ink/65">Captured</dt>
              <dd>{formatDateTime(p.captured_at)}</dd>
            </div>
            <div>
              <dt className="text-xs text-drs-ink/65">Location</dt>
              <dd>
                {p.lat != null && p.lng != null ? (
                  <a
                    className="text-drs-green underline-offset-4 hover:underline"
                    href={`https://www.google.com/maps?q=${p.lat},${p.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                    <span className="sr-only"> (opens map in a new tab)</span>
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            {p.note && (
              <div className="md:col-span-3">
                <dt className="text-xs text-drs-ink/65">Note</dt>
                <dd>{p.note}</dd>
              </div>
            )}
          </dl>
        </Card>
      ))}
    </div>
  );
}
