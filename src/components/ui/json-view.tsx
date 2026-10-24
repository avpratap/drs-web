export function JsonView({ value, label = "Details" }: { value: unknown; label?: string }) {
  if (value === null || value === undefined) return <span className="text-drs-ink/70">—</span>;
  return (
    <pre
      aria-label={label}
      tabIndex={0}
      className="max-h-80 overflow-auto rounded-lg bg-drs-cream/60 p-3 font-mono text-xs leading-relaxed text-drs-ink"
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
