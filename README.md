# drs-web — DRS Admin Dashboard

Next.js (App Router, TypeScript strict) + [Refine](https://refine.dev) (headless) + Tailwind, deployable on Vercel.
All data comes from the FastAPI backend ([`avpratap/drs-backend`](https://github.com/avpratap/drs-backend))
through a **typed client generated from its OpenAPI spec**.

## Quick start

```bash
pnpm install
cp .env.example .env.local      # set NEXT_PUBLIC_API_BASE (and NEXT_PUBLIC_SITE_URL)
pnpm dev --port 3100            # http://localhost:3100
```

Run the backend locally (see drs-backend README) and add `http://localhost:3100` to its `CORS_ORIGINS`
(not strictly required — the browser only calls this app's own `/api/*` routes, which call the backend server-side).

### Environment

| Variable                       | Where       | Description                                                                                                                                                                                                                                                                                              |
| ------------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE`         | build + run | FastAPI origin, no trailing slash, e.g. `https://api.drs.example`. Inlined at build time, so set it in Vercel for each environment and redeploy after changing it. Also the media origin allowed by the CSP.                                                                                             |
| `NEXT_PUBLIC_SITE_URL`         | build + run | This site's public origin, no trailing slash, e.g. `https://drsdairy.in`. Used for canonical URLs/`metadataBase`, Open Graph and JSON-LD URLs, and the sitemap line in `robots.txt` (`src/lib/site.ts`). Defaults to `http://localhost:3100` — **set it in production** or those all point at localhost. |
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | build       | `true` to turn on Razorpay checkout once the backend has gateway keys (`src/lib/payments.ts`).                                                                                                                                                                                                           |
| `NEXT_PUBLIC_FSSAI_LICENSE`    | build       | Optional FSSAI licence number shown in the footer and on /about.                                                                                                                                                                                                                                         |

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
- **Instant navigation** — `cacheComponents` + `partialPrefetching` are on. The `(admin)` layout renders the shell
  and page directly (no client-side auth gate that would drop the page from the server render) and
  `(admin)/loading.tsx` is the static fallback while a page streams in; `AuthGuard` signs out a session the
  backend later rejects. `next dev` should show no instant-navigation Insights.
- **Pagination** — the API has `limit/offset` but no totals, so lists fetch `pageSize + 1` to know if a next page exists.

### Modules

All screens are Refine resources over the typed client (`src/modules/*/handlers.ts`), registered in
`src/modules/registry.ts` (data) and `src/modules/resources.ts` (routes). Generic building blocks live in
`src/components/resource/` (list with filters + pagination, field grid, form, action dialog, line items).

| Phase | Area       | Screens                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Catalog    | Products (status filter incl. retired), variants, price tiers, product prices                                                                                                                                                                                                                                                                                                                                                      |
| 2     | Billing    | Accounts & wallets (balances, wallet ledger, credit ledger, top-up, adjust, settle credit, type & tier), withdrawals (approve/reject)                                                                                                                                                                                                                                                                                              |
| 2     | Payments   | Payments (refund), refunds (reconcile)                                                                                                                                                                                                                                                                                                                                                                                             |
| 2     | Inventory  | Stock (low stock, reorder suggestions, adjust, wastage, reorder point, movements), batches (FEFO, receive, expire), locations, transfers (dispatch/receive/cancel), suppliers, purchase orders (place, GRN receive, cancel), BOMs, production orders (start/complete/cancel)                                                                                                                                                       |
| 2     | Delivery   | Daily deliveries (date, summary, cash collected), fulfilment detail (POD photo/signature/GPS, cash, returns, mark failed, invoice), orders (cancel)                                                                                                                                                                                                                                                                                |
| 3     | Insights   | Reports (KPIs, revenue & orders trend, top products — with data tables), audit log                                                                                                                                                                                                                                                                                                                                                 |
| 3     | Content    | Banners, articles & pages (publish/unpublish), newsletter subscribers                                                                                                                                                                                                                                                                                                                                                              |
| 3     | Customers  | Support tickets (thread, reply, status), ratings moderation (approve/reject/hide, reply), coupons                                                                                                                                                                                                                                                                                                                                  |
| 3     | System     | Feature flags                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 4     | Operations | Returns / RMA (status filter, approve, reject, capped refund, store-credit & credit-note trail), subscriptions (filters, standing-order line editor, pause/resume/cancel), shops (price tier, deactivate/reactivate, delivery-driver assign/unassign), driver assignments (driver ↔ shop: filter by driver/shop/status, assign, unassign, reassign), users & staff (role/status filters, edit), cutoff runs (status, run, history) |

Phase 4 screens need the admin endpoints from avpratap/drs-backend#3 (`/admin/returns/{id}`, `/admin/subscriptions`, `/admin/shops/{id}`, `/admin/cutoff/runs`, `/admin/cutoff/status`, named `/admin/delivery-assignments`).

**Backend requirements** (added in [avpratap/drs-backend#2](https://github.com/avpratap/drs-backend/pull/2)):
`X-Total-Count` on admin lists, `GET /admin/products?status=`, `GET /products/variants/{id}`, account wallet/credit
ledgers, delivery fulfilment (POD + cash), and admin GETs for tickets/articles/pages/banners.

### Running locally without the backend

`e2e/mock-api.mjs` is a stateful fake of the API (seeded with realistic data) used by the e2e suite:

```bash
node e2e/mock-api.mjs                                   # :8787
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8787 pnpm dev --port 3100   # http://localhost:3100 — any mobile, OTP 123456
```

## Brand & accessibility

Palette lives in `src/lib/brand.ts`, exposed as `theme.extend.colors.drs` in `tailwind.config.ts` (loaded via `@config`) and as `--color-drs-*` CSS variables in `globals.css`:
green `#0D4C3C`, gold `#C5A253`, cream `#F4EADE`, maroon `#3B0A1E`, sky `#6FC5F4`, ink `#1E1A1E`, white.
Font: Poppins via `next/font`.

- Cream content / deep-green sidebar, ink text. **Gold is a sparing accent** (active-nav bar, heading hairline,
  avatar ring, B2B badge ring) — never a fill or text colour (gold on cream is < 3:1).
- **Sky only for the milk / buttermilk line** (`CategoryBadge`).
- Maroon for destructive actions and errors.
- Mobile-first, checked at 360 / 768 / 1024 / 1440. 44px min touch targets, visible focus rings (green on light,
  gold on green), labelled form controls with `aria-describedby` errors, skip link, reduced-motion respected.

## UI components (shadcn/ui + Radix)

The component foundation is [shadcn/ui](https://ui.shadcn.com) on Radix primitives, themed with the DRS
brand rather than shadcn's neutral palette:

- `components.json` is the shadcn config (`@/components/ui`, `@/lib/utils`, lucide icons). The registry
  wasn't reachable when this was set up, so the components were written in the shadcn structure by hand;
  `npx shadcn add <name>` works for new ones where the registry is reachable.
- `src/app/globals.css` maps the shadcn semantic tokens (`--background`, `--primary`, `--accent`,
  `--border`, `--ring`…) onto the DRS colours: cream background, green primary/ring, a 10% green tint for
  hover/selected, maroon destructive, ink-20% borders. Animations come from `tw-animate-css`.
- `src/components/ui/`: `select.tsx` (Radix Select), `date-picker.tsx` + `calendar.tsx` (react-day-picker in
  a Radix Popover), `checkbox.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `popover.tsx`, `toast.tsx`,
  `search-input.tsx`, `disclosure.tsx`. No native select/date/checkbox controls remain; number spinners and
  the browser's search/autofill decorations are styled away in `globals.css`.
- **DatePicker**: `<DatePicker value="YYYY-MM-DD" onChange />` (or `type: "date"` in `FieldGrid`/`LineItems`,
  `FormDate` in custom forms). Same collision-aware popup behaviour as the Select.
- **Sidebar**: sections are Radix Collapsibles; the one holding the current page opens itself, and your
  open/closed choices are remembered in `localStorage` (`drs.nav.groups`).
- **Select**: every dropdown in the app is `<Select options={[{ value, label }]} value onChange />`; inside
  react-hook-form use `FormSelect` (or a `FieldGrid` field with `type: "select"`). Numbers stay numbers.
  The list opens at the trigger's width, flips above or shifts sideways so it is never cut off at a
  screen edge, and portals into an enclosing modal `<dialog>` so it renders above it; Esc closes only
  the list. `fit` sizes a filter's trigger to its widest option.

## Deploying on Vercel

Import the repo, framework preset **Next.js**, set `NEXT_PUBLIC_API_BASE`, deploy. Make sure the backend's
`TRUSTED_PROXY_HOPS` is configured if you want OTP rate limits keyed on the forwarded client IP.

## Tests

- **Unit (Vitest + RTL, `tests/unit`)** — helpers, data provider, one handler/action suite per module (exact
  method/path/query/body/Idempotency-Key per call), UI components (action dialog, line items, charts, tabs, POD
  viewer, filters) and page flows per module rendered inside Refine with a stubbed fetch.
- **E2E (Playwright, `e2e/`)** — login/logout/role gate plus every major flow of each phase, run at **360, 768,
  1024 and 1440 px**. Each visited page is checked with **axe-core (WCAG 2.1 A/AA)** and for horizontal page
  overflow. The suite builds the app against `e2e/mock-api.mjs`. First run: `pnpm exec playwright install chromium`.
