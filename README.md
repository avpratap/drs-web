# drs-web — DRS Admin Dashboard

Next.js (App Router, TypeScript strict) + [Refine](https://refine.dev) (headless) + Tailwind, deployable on Vercel.
All data comes from the FastAPI backend ([`avpratap/drs-backend`](https://github.com/avpratap/drs-backend))
through a **typed client generated from its OpenAPI spec**.

## Quick start

```bash
pnpm install
cp .env.example .env.local      # set NEXT_PUBLIC_API_BASE
pnpm dev                        # http://localhost:3000
```

Run the backend locally (see drs-backend README) and add `http://localhost:3000` to its `CORS_ORIGINS`
(not strictly required — the browser only calls this app's own `/api/*` routes, which call the backend server-side).

### Environment

| Variable               | Where       | Description                                                                                                                                                        |
| ---------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_API_BASE` | build + run | FastAPI origin, no trailing slash, e.g. `https://api.drs.example`. Inlined at build time, so set it in Vercel for each environment and redeploy after changing it. |

## Scripts

| Script                | What it does                                                  |
| --------------------- | ------------------------------------------------------------- |
| `pnpm dev`            | Dev server                                                    |
| `pnpm build`          | Production build (`next build`)                               |
| `pnpm lint`           | ESLint (next/core-web-vitals + TS + prettier)                 |
| `pnpm format[:check]` | Prettier write / check                                        |
| `pnpm typecheck`      | `tsc --noEmit` (strict)                                       |
| `pnpm test`           | Vitest + React Testing Library unit tests (`tests/unit`)      |
| `pnpm test:e2e`       | Playwright smoke (login + product list) against a mock API    |
| `pnpm api:generate`   | Regenerate OpenAPI spec from the backend **and** the TS types |

## Regenerating the API client

The client is [`openapi-fetch`](https://openapi-ts.dev/openapi-fetch/) typed by
[`openapi-typescript`](https://openapi-ts.dev/) output. Spec and types are committed so builds don't need the backend.

```bash
# needs uv + a checkout of drs-backend (default ../drs-backend); no database required
BACKEND_DIR=../drs-backend pnpm api:generate
```

This runs `from app.main import app; app.openapi()` in the backend and writes `openapi/openapi.json`, then
regenerates `src/lib/api/schema.d.ts`. `pnpm typecheck` will flag any call site the API change broke.

## Architecture

```
Browser ──typed client (openapi-fetch)──► /api/backend/*  (Next route handler, BFF)
                                              │ attaches Bearer from httpOnly cookie
                                              ▼
                                       NEXT_PUBLIC_API_BASE  (FastAPI)
Login  ──► /api/auth/otp/request ─► POST /api/v1/auth/otp/request
       ──► /api/auth/otp/verify  ─► POST /api/v1/auth/otp/verify  → sets cookies (admins only)
401    ──► /api/auth/refresh     ─► POST /api/v1/auth/refresh     → rotated pair, cookies replaced
```

- **Typed client** — `src/lib/api/client.ts` (factory), `server.ts` (route handlers → backend),
  `browser.ts` (browser → BFF). Every Refine resource in `src/providers/data-provider.ts` is a typed call.
- **Auth** — phone OTP. JWTs never reach JavaScript: the access token is an `httpOnly` `SameSite=Lax` cookie;
  the refresh token is an `httpOnly` `SameSite=Strict` cookie scoped to `/api/auth`. On a 401 the browser client
  calls `/api/auth/refresh` **once** (concurrent 401s share one rotation — the backend revokes the whole session
  family if a rotated refresh token is reused) and retries. Mutating BFF calls require a same-origin `Origin`.
- **Admin gate** — `src/proxy.ts` (Next 16's renamed middleware) redirects every page to `/login` unless the
  access cookie carries `role=admin`; non-admin logins are revoked immediately at verify time. The backend
  remains the authority (`require_role("admin")` on every admin endpoint).
- **Pagination** — the API has `limit/offset` but no totals, so lists fetch `pageSize + 1` to know if a next page exists.

### Catalog (Phase 1)

| Resource       | Routes                                                                       | Endpoints                                                          |
| -------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Products       | `/products`, `/create`, `/:id`, `/:id/edit`                                  | `/api/v1/products` (DELETE = retire)                               |
| Variants       | `/products/:id` (list), `/products/:id/variants/create`, `…/:variantId/edit` | `/api/v1/products/{id}/variants`, `/api/v1/products/variants/{id}` |
| Price tiers    | `/price-tiers…`                                                              | `/api/v1/admin/price-tiers`                                        |
| Product prices | `/product-prices…` (`?product_id=` filter)                                   | `/api/v1/admin/product-prices`                                     |

## Brand & accessibility

Palette lives in `tailwind.config.ts` under `theme.extend.colors.drs` (loaded via `@config` in `globals.css`):
green `#0D4C3C`, gold `#C5A253`, cream `#F4EADE`, maroon `#3B0A1E`, sky `#6FC5F4`, ink `#1E1A1E`, white.
Font: Poppins via `next/font`.

- Cream content / deep-green sidebar, ink text. **Gold is a sparing accent** (active-nav bar, heading hairline,
  avatar ring, B2B badge ring) — never a fill or text colour (gold on cream is < 3:1).
- **Sky only for the milk / buttermilk line** (`CategoryBadge`).
- Maroon for destructive actions and errors.
- Mobile-first, checked at 360 / 768 / 1024 / 1440. 44px min touch targets, visible focus rings (green on light,
  gold on green), labelled form controls with `aria-describedby` errors, skip link, reduced-motion respected.

## Deploying on Vercel

Import the repo, framework preset **Next.js**, set `NEXT_PUBLIC_API_BASE`, deploy. Make sure the backend's
`TRUSTED_PROXY_HOPS` is configured if you want OTP rate limits keyed on the forwarded client IP.

## Tests

- `tests/unit` — error mapping, pagination, JWT/phone helpers, single-flight refresh, badges, login form (RTL).
- `e2e/smoke.spec.ts` — starts `e2e/mock-api.mjs` (a tiny fake backend) and a production build, then logs in with
  OTP and checks the product list at mobile and 1440px viewports. First run: `pnpm exec playwright install chromium`.
