# WellPoint — Execution Plan: Align Implementation to Supabase-Direct Architecture

## 0. Decision (confirmed with user)

Keep the existing **Supabase-direct SPA** and **revise the documentation** to match the real implementation, rather than rebuilding the documented NestJS + PostgreSQL + TypeORM + Zod + Docker Compose stack (which is currently ~0% built: `backend/` deleted, no `docker-compose.yml`).

**Goal:** reach full completion of the Must-have feature set (`docs/plan.md` §4) on the existing frontend, using Supabase for persistence, and bring every doc file back into agreement with the code.

---

## 1. Current state (audit summary)

- `frontend/` is a working React 19 + TanStack Router + Vite 8 + Tailwind v4 + shadcn SPA.
- Data layer is **Supabase-direct**: `water_sources` table (CRUD + realtime) via `lib/supabase.ts` + `lib/water-store.ts`; Supabase Auth (email/password) via `lib/auth.ts`; `profiles` table holds role + barangay.
- 57 real barangay boundaries load from `frontend/public/catbalogan-brgys.geojson` and render over a MapLibre GL (Carto) basemap; point-in-polygon in `lib/barangays.ts`.
- Strong reusable UI already exists: landing page, barangay map, water-sources list, outage-alerts list, deliveries (filling stations), role switcher.
- **Not built / broken:**
  - No derived logic: access state, vulnerability tier, metrics, and rule-based alerts are absent.
  - `data/api.ts` imports 4 modules that do not exist (`lib/store`, `lib/alerts`, `lib/metrics`, `data/types`) and is referenced by nothing — dead code.
  - `lib/waterStore.ts` is an orphan duplicate of `lib/water-store.ts` (case-collision).
  - Reports live in `localStorage`, not Supabase (`lib/water-store.ts:251`).
  - `dashboard.reports.tsx` and `dashboard.settings.tsx` are empty stubs.
  - No KPI cards / status banner; no `Simulate disruption` / `Reset demo`.
  - `components/SupplyOutlook.tsx` calls Open-Meteo at runtime.
  - `frontend/README.md` is the default "TanStack Start" scaffold README (wrong framework).
  - `frontend/.env` (gitignored) holds a Supabase service-role key whose value equals `SUPABASE_JWT_SECRET` — likely misconfigured.
- **Docs drift:** `plan.md` / `architecture.md` / `system-design.md` / `submission.md` describe the NestJS/Docker/TypeORM stack; `permission_guide.md` still describes a loan-domain RBAC (admin/manager/staff/viewer/pending) referencing the deleted backend.

---

## 2. Target architecture (revised)

```
Browser (React 19 + TanStack Router + shadcn/Tailwind)
  ├─ lib/seed.ts            deterministic demo domain data (barangays, systems)
  ├─ lib/store.ts           single in-memory domain store (useSyncExternalStore)
  ├─ lib/metrics.ts         derived metrics + status band  (pure functions)
  ├─ lib/alerts.ts          derived alerts from documented rules (pure)
  ├─ lib/vulnerability.ts   per-barangay vulnerability tier (pure)
  ├─ lib/supabase.ts        Supabase client
  ├─ lib/water-store.ts     physical assets (markers) + reports, synced to Supabase
  └─ routes/…               dashboard, map, sources, alerts, reports, demo controls
        │
        └── Supabase (Postgres)  ← single source of truth for user-authored data
             ├─ water_sources  (existing)
             ├─ reports        (NEW — community reports, persisted + realtime)
             └─ profiles       (existing — users + role)
```

- **Deterministic seed** lives client-side (`lib/seed.ts`, `baseSeed = 20261006`): 57 barangay records (PSGC + population + affordability + centroid + distance-to-center), 5 pilot water systems (level I/II/III), and source→system links.
- **Physical assets + reports** persist in Supabase. The demo's static domain attributes are client-seeded and reset on demand.
- **All scoring/alerts derive client-side** from pure functions — no black box, thresholds displayed in the UI.
- **Map:** keep MapLibre GL (Carto basemap) + GeoJSON overlay. Drop the "inline SVG / no tiles" claim; add a graceful offline note.
- **Auth:** keep Supabase Auth + role switcher (demo-only permission presentation).

---

## 3. Key decisions

| # | Decision | Choice |
| :-: | :--- | :--- |
| D1 | Derived logic location | Client-side pure functions in `lib/` (no backend, no Edge Functions) |
| D2 | Domain model | Lightweight superset: keep `Asset` markers; add `WaterSystem` + per-barangay `population`/`affordability`; derive `accessState`/`vulnerabilityTier` |
| D3 | Reports persistence | Move from `localStorage` → Supabase `reports` table (reuse realtime channel) |
| D4 | Seed/reset | Client-side deterministic seed + `Reset demo` clears Supabase `reports` and restores `water_sources.status='ok'` |
| D5 | Map tiles | Keep MapLibre + Carto (already polished); revise docs instead of building inline SVG |
| D6 | Auth | Keep Supabase Auth + role switcher; reframe docs (no longer "no login") |
| D7 | Open-Meteo outlook | Keep as optional bonus; it already degrades gracefully; document as live-data feature |

---

## 4. Ordered tasks

### Phase 0 — Stabilize (remove dead code so lint/typecheck go green)

1. Delete `frontend/src/data/api.ts` (dead; imports missing modules, unreferenced). If a thin async facade is still wanted later, re-add it **after** the lib modules exist.
2. Delete `frontend/src/lib/waterStore.ts` (orphan duplicate of `water-store.ts`).
3. Rename `frontend/src/lib/Supply.ts` → `frontend/src/lib/supply.ts` and update the import in `components/SupplyOutlook.tsx`.
4. Add a `typecheck` script to `frontend/package.json`: `"typecheck": "tsc --noEmit"` (build currently does not type-check).
5. Rewrite `frontend/README.md` to describe the actual app (setup, `.env` vars, run/build/lint, table setup via SQL, demo flow).

### Phase 1 — Domain model + deterministic seed

6. Create `frontend/src/data/types.ts` with the full domain model:

   ```ts
   export type Role = 'citizen' | 'official' | 'lgu' | 'drrm'
   export type AssetKind = 'pump' | 'well' | 'reservoir' | 'station'
   export type SourceStatus = 'ok' | 'low' | 'empty' | 'repair' | 'unsafe'
   export type ServiceLevel = 'I' | 'II' | 'III'
   export type Quality = 'safe' | 'advisory' | 'unsafe'

   export interface Asset { id: string; kind: AssetKind; name: string; lng: number; lat: number; status: SourceStatus; systemId: string }
   export interface WaterSystem { id: string; name: string; level: ServiceLevel; barangayId: string; sourceIds: string[]; serviceHours: number; operator: string }
   export interface Community { psgcCode: string; name: string; areaSqKm: number; lat: number; lng: number; distanceToCenterKm: number; population: number; affordability: number; systemId: string }
   export type AccessState = 'served' | 'partial' | 'underserved'
   export type VulnerabilityTier = 'low' | 'medium' | 'high'

   export type ReportType = 'no_water' | 'low_pressure' | 'contamination' | 'infrastructure_damage' | 'other'
   export type ReportStatus = 'new' | 'acknowledged' | 'resolved'
   export interface CommunityReport { id: string; reporter: string; area: string; type: ReportType; description: string; status: ReportStatus; createdAt: string }

   export type AlertType = 'shortage' | 'contamination' | 'outage'
   export type AlertSeverity = 'info' | 'warning' | 'critical'
   export interface Alert { id: string; type: AlertType; severity: AlertSeverity; area: string; systemId?: string; reportId?: string; raisedAt: string; status: 'active' | 'resolved'; reason: string; message: string; action: string }

   export interface Metrics { accessCoveragePct: number; reliabilityPct: number; affordability: number; activeAlerts: number; score: number; band: 'Secure' | 'Watch' | 'Critical' }
   export interface BarangayDetail { community: Community; accessState: AccessState; vulnerabilityTier: VulnerabilityTier; trend: number[]; openReports: CommunityReport[]; alerts: Alert[] }
   ```

7. Create `frontend/src/lib/seed.ts`: deterministic seed for the 5 pilot systems + per-barangay `population`/`affordability`/`systemId` (reuse the `architecture.md` §4 pilot table — Poblacion 1 secure, San Andres/Mercedes watch, Bangon watch, Canlapwas critical). Import the 57 barangay names/PSGC/area/centroid from the GeoJSON (extend `lib/barangays.ts` to also return `psgcCode`, `areaSqKm`, centroid). Compute `distanceToCenterKm` in `lib/geo.ts`.
8. Extend `lib/water-store.ts` so `Asset` carries `systemId`, and seed water sources map to the 5 systems (keep the existing demo markers, assign `systemId`).

### Phase 2 — Derived logic (pure functions)

9. Create `frontend/src/lib/vulnerability.ts` — port `architecture.md` §5.3:
   - `isolation = 0.5·min(1, areaSqKm/10) + 0.5·min(1, distanceToCenterKm/15)`
   - tier = f(isolation, service level, source-capacity margin). Expose the breakdown for the drill-down.
10. Create `frontend/src/lib/alerts.ts` — port `architecture.md` §5.1 rules over latest status (derived from each system's sources: `available` false → outage critical; `quality unsafe` → contamination critical; flow thresholds → shortage; declining trend + high vulnerability → elevated critical; source statuses → info/warning). Each alert carries `message`, `action`, and a livelihood impact note for high-vulnerability barangays. `deriveActiveAlerts(state)` and `allAlerts(state)`.
11. Create `frontend/src/lib/metrics.ts` — port `architecture.md` §5.2 (access coverage, reliability, affordability, score with penalty, status band). Access state per barangay: full iff system available && flow≥40 && quality safe && affordability not low.
12. Create `frontend/src/lib/store.ts` — a `useSyncExternalStore`-based store that composes `seed` + `water-store` state + derived `barangays`, `systems`, `alerts`, `metrics`. Provide `getState()`. This is the read model the UI consumes.

### Phase 3 — Persistence (reports → Supabase)

13. Add a `reports` table + RLS (new SQL file under `supabase/` or `seed-data/`): `id uuid`, `reporter text`, `area text`, `type text`, `description text`, `status text default 'new'`, `created_at timestamptz default now()`. Grant insert for authenticated users; update (ack/resolve) for `lgu`/`official` per `profiles.role`.
14. Replace the `localStorage` report handling in `lib/water-store.ts` with Supabase CRUD (select/insert/update) + realtime subscription (mirror the existing `water_sources` channel pattern).
15. Ensure report writes **re-derive alerts** (call the Phase-2 functions after mutation) and invalidate the relevant UI.

### Phase 4 — Dashboard (KPI cards + banner + demo controls)

16. Rewrite `routes/dashboard.index.tsx`: add the status banner (`Secure`/`Watch`/`Critical` from `metrics.band`), four KPI cards (coverage %, reliability, active alerts, affordability), and the score breakdown (why the score is what it is). Keep the role-aware views below.
17. Add **demo controls** (`Simulate disruption` with type typhoon/drought/contamination/maintenance + a target system, and `Reset demo`). Implement as store actions: simulate applies deterministic status overrides to a system's sources; reset clears Supabase `reports`, restores `water_sources.status='ok'`, and re-seeds local state. Wire to a compact "Demo controls" bar in the dashboard header.

### Phase 5 — Coverage map coloring + drill-down

18. In `routes/dashboard.map.tsx`, color each barangay polygon by its **derived access state** (served=green, partial=amber, underserved=red) instead of the current uniform fill. Show the vulnerability tier in the selection sheet.
19. Add a per-barangay drill-down (sheet content): access state, vulnerability breakdown (isolation + level + capacity), open reports, active alerts, short flow trend. Reuse `BarangayDetail` from Phase 2.

### Phase 6 — Alerts list + report flow

20. Rewrite `routes/dashboard.alerts.tsx` to render `Alert[]` from `lib/alerts.ts` (severity, area, time, reason, message, recommended action, impact note), priority-sorted (severity then underserved-first).
21. Implement `routes/dashboard.reports.tsx`: submission form (area, type, description) → `POST`-equivalent via Supabase insert → success confirmation; list with `new`/`acknowledged`/`resolved` badges; `lgu`/`official` can acknowledge/resolve.
22. Repurpose `routes/dashboard.settings.tsx` into "Demo controls" or remove it from the nav if Phase-4 controls live elsewhere (avoid a dead route).

### Phase 7 — Docs reconciliation

23. Rewrite `docs/architecture.md` §2–§9 to describe the Supabase-direct architecture, client-side derived logic (rename §5 file refs from `backend/src/…` to `frontend/src/lib/…`), MapLibre basemap + GeoJSON overlay, Supabase Auth + role switcher, and remove the Docker Compose/NestJS/TypeORM/Zod/TypeScript-strict specifics.
24. Rewrite `docs/plan.md` §3, §4, §6 (tech stack + feasibility text) to match; keep the Must/Should/Won't lists as the feature source of truth.
25. Rewrite `docs/system-design.md` Part 2 (data flows) to the client-side store + Supabase write paths; keep Part 1 (persona matrix) but re-scope roles to `citizen/official/lgu/drrm` and mark auth as demo-only.
26. Update `docs/submission.md` (build & run = `cd frontend && npm i && npm run dev`; remove Docker/backend checklist; fill in URL/repo/team).
27. Update `docs/pitch-outline.md` demo script to the real click-path (dashboard → coverage map → alerts → report → simulate → reset).
28. **Fix `docs/permission_guide.md`** (delete or rewrite — it currently describes a loan-domain RBAC referencing the deleted backend; reconcile to the Supabase Auth + `profiles.role` reality or fold into `auth-and-permissions.md`).
29. Update `docs/auth-and-permissions.md` to note the *current* prototype actually ships Supabase email/password auth + role switcher (not just a design target).

### Phase 8 — QA & validation

30. Run `npm run lint`, `npm run typecheck`, `npm run build` in `frontend/` until green.
31. Fresh-seed smoke test: load `/` → `/dashboard` → map shows 57 polygons colored by access state → alerts populated → submit a report → alert appears → simulate typhoon → banner/KPIs react → reset → known-good state.
32. Verify determinism: two `Reset demo` runs produce identical state.
33. Confirm graceful offline behavior (map basemap fails → barangay GeoJSON still renders; Open-Meteo fails → outlook shows retry, not a crash).
34. Rotate the Supabase service-role key / JWT secret if the misconfigured value in `.env` is real, and confirm `.env` stays out of git.

---

## 5. Risks & open questions

- **Derivation is client-side** (not server-side). Acceptable for a single-tenant demo; the docs must be explicit that this is a prototype boundary (like the auth boundary).
- **Map basemap needs network.** The venue provides Wi-Fi; add a `blank`-tile fallback via the existing `<Map blank>` mode if offline reliability is required.
- **`SUPABASE_SERVICE_ROLE_KEY` == `SUPABASE_JWT_SECRET`** — confirm whether this is intentional before shipping; service-role key should be a JWT, not the signing secret.
- **Scope control:** the role switcher is presentation-only; do not claim it enforces access (RLS on Supabase tables is the only real boundary today).

---

## 6. Acceptance criteria (done when…)

- All Must features (`plan.md` §4) work end-to-end on the Supabase stack.
- Reports persist in Supabase and feed the alert view without a reload.
- `Simulate disruption` and `Reset demo` are deterministic and reversible.
- Coverage map colors by derived access state; drill-down shows vulnerability + trend.
- `lint`, `typecheck`, `build` all green.
- Every doc file in `docs/` describes the shipped architecture with no references to a non-existent `backend/`, Docker Compose, NestJS, TypeORM, Zod, or "no login".
