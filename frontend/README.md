# WellPoint — Frontend

A React 19 + TanStack Router + Vite SPA that talks directly to Supabase. It is the
water-security access & early-warning dashboard for Catbalogan City LGUs: a live
coverage map of the 57 barangays, derived alerts and metrics, community reports,
and demo controls (`Simulate disruption` / `Reset demo`).

There is no separate backend. All persistence lives in Supabase (Postgres); all
derived logic (access state, vulnerability tier, alerts, metrics) runs client-side
as pure functions in `src/lib/`.

## Prerequisites

- Node 20+ (uses `npm`; the repo also has a `pnpm` allowlist in `package.json`).
- A Supabase project with the SQL in `../supabase/` applied (creates `water_sources`,
  `profiles`, and `reports` tables plus row-level security).

## Environment

Copy `.env` from the values below (`.env` is gitignored):

```bash
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

The app refuses to run without these and prints a clear error. Never put the
service-role key or JWT secret in the frontend environment.

## Run

```bash
npm install
npm run dev       # http://localhost:3000
```

## Build & quality

```bash
npm run build       # Vite production build (dist/)
npm run typecheck   # tsc --noEmit (build alone does not type-check)
npm run lint        # eslint
npm run format      # prettier --write + eslint --fix
npm run check       # prettier --check
```

## Routes

| Path | What it is |
| :--- | :--- |
| `/` | Landing page |
| `/register`, `/login` | Supabase Auth (email/password) |
| `/dashboard` | Status banner + KPI cards + role-aware views |
| `/dashboard/map` | 57-barangay coverage map (colored by derived access state) |
| `/dashboard/sources` | Water sources grouped per barangay |
| `/dashboard/alerts` | Derived early-warning alerts |
| `/dashboard/warnings` | DRRM early warnings (issue + target barangays) |
| `/dashboard/deliveries` | DRRM filling stations |
| `/dashboard/reports` | Community reports (submit + acknowledge/resolve) |
| `/dashboard/users` | LGU role & barangay management |
| `/dashboard/settings` | Demo controls (simulate disruption / reset demo) |

## Data model (at a glance)

- **Static reference data** is seeded in Supabase by `../supabase/schema.sql` (the 57
  barangays' metadata and the 5 pilot water systems), with a deterministic client-side
  fallback in `src/lib/seed.ts` (`baseSeed = 20261006`).
- **User-authored data** lives in Supabase: `water_sources` (physical asset markers),
  `reports` (community reports), `warnings` (DRRM early warnings), and `profiles`
  (user + role + barangay). These sync via `src/lib/water-store.ts` with realtime subscriptions.
- **Derived data** (access state, vulnerability, alerts, metrics) is never stored —
  it is recomputed from the above in `src/lib/{vulnerability,alerts,metrics,store}.ts`.

## Demo flow

1. Log in (any Supabase account; role comes from `profiles.role`).
2. Read the dashboard banner and KPI cards.
3. Open the coverage map — green = served, amber = partial, red = underserved.
4. Submit a report, then watch it appear in the alerts view without a reload.
5. `Simulate disruption` (typhoon / drought / contamination / maintenance) and watch
   the banner and alerts react, then `Reset demo` back to a known-good state.
