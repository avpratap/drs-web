/** Static loading shell for an admin page: shown instantly while the page's data streams in. */
export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading page" className="animate-pulse motion-reduce:animate-none">
      <div className="h-8 w-48 max-w-full rounded-md bg-drs-green/10" />
      <div className="mt-3 h-4 w-80 max-w-full rounded bg-drs-green/10" />
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-drs-white/70 ring-1 ring-drs-green/10" />
        ))}
      </div>
      <div className="mt-8 h-64 rounded-xl bg-drs-white/70 ring-1 ring-drs-green/10" />
    </div>
  );
}
