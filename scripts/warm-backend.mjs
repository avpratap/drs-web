// Wakes the (possibly sleeping) backend BEFORE `next build`.
//
// Why: the storefront statically prerenders catalogue/content pages, which read the
// backend inside `"use cache"` functions. Next's cacheComponents gives each cached
// function a short prerender budget; a COLD backend (free Render dyno, ~50s cold start)
// makes that first fetch exceed the budget and fails the whole build
// ("A `"use cache"` function took too long during prerendering"). Warming the backend
// first means the prerender fetches hit a fast, awake backend — the same condition under
// which earlier deploys succeeded.
//
// Runs only on Vercel, and NEVER fails the build: if the backend can't be reached it logs
// and exits 0, letting the build proceed (the per-read `failed()` fallback still applies).

const base = process.env.NEXT_PUBLIC_API_BASE;

// Local and CI builds point at a mock or local backend (or have no base); nothing to warm.
if (!process.env.VERCEL || !base) {
  process.exit(0);
}

const DEADLINE_MS = 90_000; // stop trying after 90s and let the build run regardless
const PER_TRY_TIMEOUT_MS = 15_000; // allow a cold-start response
const GAP_MS = 3_000;
const start = Date.now();

async function ping(path) {
  const res = await fetch(new URL(path, base), {
    signal: AbortSignal.timeout(PER_TRY_TIMEOUT_MS),
    cache: "no-store",
  });
  return res.ok;
}

let attempt = 0;
while (Date.now() - start < DEADLINE_MS) {
  attempt++;
  try {
    if (await ping("/healthz")) {
      // Instance is up; prime an app route (DB pool, catalogue) too — best effort.
      try {
        await ping("/api/v1/products?limit=1");
      } catch {}
      console.log(`warm-backend: awake after ${attempt} attempt(s) in ${Date.now() - start}ms`);
      process.exit(0);
    }
  } catch {
    // cold start / transient network error — keep trying until the deadline
  }
  await new Promise((r) => setTimeout(r, GAP_MS));
}

console.warn(
  `warm-backend: backend did not respond within ${DEADLINE_MS}ms; proceeding with build (fallbacks apply)`,
);
process.exit(0);
