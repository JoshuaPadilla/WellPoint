# WellPoint — Submission Record

Maintained per the `hackathon-qa-deploy` skill. Fill in the bracketed values before submitting.

## Submission details

| Field | Value |
| :--- | :--- |
| Project | WellPoint — Water Security access & early-warning platform |
| Assigned challenge | Challenge 5 — Water Security |
| Event | rSCENE 2026 Hackathon, Catbalogan City, Samar |
| Team | [team name] |
| Members | [member 1] · [member 2] · [member 3] |
| Representing LGU | [city / municipality] |
| Public URL | [deployment URL] |
| Repository | [repository URL] |

## Build & run

```bash
cd frontend
npm install
# 1) create .env with:
#   VITE_SUPABASE_URL=https://<project>.supabase.co
#   VITE_SUPABASE_ANON_KEY=<anon public key>
# 2) apply supabase/schema.sql in the Supabase SQL editor
npm run dev        # SPA at http://localhost:3000
```

The deterministic demo seed is client-side (`frontend/src/lib/seed.ts`, `baseSeed = 20261006`): 57 barangay boundaries + 5 pilot water systems. User-authored data (water sources, reports, profiles) lives in Supabase. Verify the quality gates: `cd frontend && npm run typecheck && npm run build`.

Deployment: build the SPA (`npm run build`) and serve `dist/` from any static host (Vercel/Netlify/VPS) against the existing Supabase project. No paid services beyond Supabase are required.

## Data sources & attribution

- **Runtime data:** water data is simulated, deterministic client-seeded data (`frontend/src/lib/seed.ts`), generated for demonstration only. User reports and source markers persist in Supabase.
- **Administrative boundaries:** `seed-data/catbalogan-brgys.geojson` (mirrored to `frontend/public/catbalogan-brgys.geojson`) — the real barangay polygons of all 57 barangays of Catbalogan City, Samar (Region VIII), PSGC-coded (`ADM*_PCODE`, `psgc_code`), with `AREA_SQKM`, from publicly available Philippine administrative-boundary data (dataset dated 2022-11-09, valid 2023-11-06). *Confirm the exact upstream source for final attribution.*
- **Location names:** barangay and municipality names of Catbalogan City, Samar (Region VIII) are used for local context. Barangay boundaries are real; water-source coordinates and all water/service attributes are simulated and illustrative.
- **Open-source dependencies** (all permissive licenses):
  - React 19 — MIT
  - TanStack Router — MIT
  - Vite — MIT
  - Tailwind CSS v4 — MIT
  - shadcn/ui + Base UI / Radix UI — MIT
  - MapLibre GL — BSD-3-Clause
  - Supabase (`@supabase/supabase-js`) — MIT (PostgreSQL — PostgreSQL License)
  - lucide-react — ISC
  - TypeScript — Apache-2.0
  - ESLint / Prettier — MIT
- The only optional third-party API called at runtime is **Open-Meteo** (`components/SupplyOutlook.tsx`) for the reservoir/weather projection; it degrades to an in-card error/retry and is not required for the demo.

## Known limitations

- Telemetry and water data are simulated; there is no live sensor or PAGASA/DOST integration in the prototype.
- Authentication is real (Supabase email/password) but role *management* has no UI — roles are set in the `profiles` table (documented production path in `docs/architecture.md` §7).
- Barangay boundaries are real (public PSGC-coded data); water-source points and all water/service inputs are illustrative, not survey-grade.
- Access state and vulnerability tier are derived from a documented model on simulated inputs — demonstration-grade, not a certified assessment.
- The coverage map uses Carto basemaps at runtime; it degrades to the MapLibre `blank` (tile-less) style when offline.
- `npm run lint` currently reports pre-existing errors in `components/ui/map.tsx` (a broken `react-hooks/exhaustive-deps` rule reference from the `@tanstack/eslint-config` scaffold) and a few strict `no-unnecessary-condition` warnings in `auth.ts` / `supply.ts`; `npm run typecheck` and `npm run build` are green.

## Level 1 checklist (due 8:00 AM Day 2)

- [ ] Working prototype at the public URL / repository
- [ ] Slide deck (technical viability focus) ready
- [ ] Feature freeze respected
- [ ] `npm run typecheck` and `npm run build` green in `frontend/` at the frozen commit
- [ ] Fresh load → deterministic seed, demo walkable (dashboard → map → alerts → report → simulate → reset)
- [ ] This file has URL, repo, and team details

## Level 2 checklist (due 8:00 AM Day 3, Top 4)

- [ ] Refinements from Level 1 feedback applied and re-verified
- [ ] Updated 5-minute deck
- [ ] Demo rehearsed end-to-end at least twice, timed
- [ ] Public URL re-verified after any change
