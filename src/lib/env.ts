/** Upstream FastAPI origin, e.g. `https://api.drs.example`. Only read on the server (route handlers / proxy). */
export function apiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE;
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE is not set");
  return base.replace(/\/+$/, "");
}
