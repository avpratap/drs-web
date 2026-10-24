import { cn } from "@/lib/cn";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section
      className={cn("rounded-xl border border-drs-ink/10 bg-drs-white p-4 shadow-sm md:p-6", className)}
    >
      {children}
    </section>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <div className="mb-1 text-sm text-drs-ink/70">{eyebrow}</div>}
        <h1 className="text-2xl font-semibold tracking-tight text-drs-green md:text-3xl">{title}</h1>
        {/* Gold hairline: the signature accent, kept small. */}
        <div aria-hidden className="mt-2 h-0.5 w-12 rounded bg-drs-gold" />
        {description && <p className="mt-3 max-w-prose text-sm text-drs-ink/75">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function DescriptionList({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => (
        <div key={i.label} className="border-b border-drs-ink/10 pb-3">
          <dt className="text-xs font-medium tracking-wide text-drs-ink/65 uppercase">{i.label}</dt>
          <dd className="mt-1 text-sm text-drs-ink">{i.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
