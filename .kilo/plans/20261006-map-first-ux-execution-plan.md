# WellPoint — Execution Plan: Map-First UX & Role-Gated Flows

Status: **proposed — plan only, no code changed yet.**
Supersedes the open items in `docs/ux-revision-plan.md` (most of that design is already
implemented in the current working tree). This plan audits what exists, then scopes the
remaining work.

## 0. Context

The working tree already implements most of the requested UX: map-first landing, role-split
reports, an official-only add-source form, DRRM warnings, and role-scoped alerts. The real
remaining work is the **LGU full-screen map redesign** plus **polish/hardening** of the
already-shipped flows. Audit table below is the source of truth.

## 1. Requested changes — audit of current working tree

| # | Request | Verdict | Current state | Gap |
| :-: | :--- | :--- | :--- | :--- |
| 1 | Users have **no dashboard**; the **map is their home** showing water sources | ✅ Done | `dashboard.index.tsx` redirects every role to `/dashboard/map`; no KPI page remains | None |
| 2 | Map **side sheet is information-only**, not a list of all barangays | ✅ Done | `dashboard.map.tsx` has no all-barangays list; only search suggestions (while typing), selected-brgy info card, legend | Orphan `/dashboard/sources` still lists all barangays (not in nav) — decide remove/guard |
| 3 | Notifications scoped to **user's barangay**; city-wide only for **admin** | ⚠️ Partial | `dashboard.alerts.tsx` already scopes `citizen`/`official` to own barangay, `lgu`/`drrm` city-wide | Label still "Alerts"; no nav badge with scoped count; whole-city warnings (`area: 'Catbalogan City'`) are hidden from users; name-matching instead of PSGC |
| 4 | **LGU has no reports screen**; brgy leaders get an **inbox**; members get a **submit form** | ⚠️ Done + polish | Nav hides Reports for `lgu`/`drrm`; `citizen` sees submit form, `official` sees inbox; RLS: `citizen`+`official` insert own-brgy, `official` triages | Direct visit for `lgu`/`drrm` shows a placeholder page instead of redirecting to the map |
| 5 | **Add source is brgy-leader-only**, via **form** (current location / map point), **not drag** | ⚠️ Done + decision | `add-source.tsx` is official-only, form + `useMyLocation` + tap-map point; `CAN_PLACE.lgu = []`; adding is never drag | Drag-to-move existing markers still exists (owner) — decide keep/remove; DRRM station placement has **no UI** anymore (Deliveries page references it but nothing creates stations) |
| 6 | **DRRM can issue advisories/warnings** | ✅ Done | `/dashboard/warnings` (lgu+drrm author, resolve/cancel, targeted barangays); merged into alerts as `source: 'authored'` | Surface via map FAB (one tap from the map) |
| 7 | **LGU map redesign**: max screen space, **FAB** quick actions, brgy info **overlays**, city-wide default zoom, auto-zoom on select | ❌ Main work | Map fills `calc(100dvh - 2.5rem)` but sits inside the padded layout with the sidebar; top-right pill buttons (not FAB); brgy click→zoom→overlay and initial city fit **already work** | Full-bleed layout + sidebar collapse + role-aware bottom-right FAB |

## 2. Remaining work — detailed specs

### 2.1 LGU (and shared) map — full-screen layout (the main deliverable)

**Files:** `frontend/src/routes/dashboard.tsx`, `frontend/src/routes/dashboard.map.tsx`,
possibly `frontend/src/routes/__root.tsx` for layout tokens.

- Add `staticData: { fullBleed: true }` to the `/dashboard/map` route definition
  (`createFileRoute('/dashboard/map')({ component, staticData: { fullBleed: true } })`).
- In `DashboardLayout` (`dashboard.tsx`), read the matched routes
  (`useMatches()` → any match with `staticData.fullBleed`, or `useLocation().pathname === '/dashboard/map'`).
  When fullBleed:
  - Layout container becomes `fixed inset-0 overflow-hidden` (no `p-4`/`gap-4`, no page padding);
    `<main>` gets no padding.
  - The desktop `<aside>` **collapses to the icon rail** and renders as a floating,
    translucent pill (absolute `left-4 top-4 z-20 bg-white/80 backdrop-blur`), overriding the
    open/closed toggle on this route.
  - The mobile top nav becomes a floating pill bar (`absolute inset-x-3 top-3 z-20 …`).
  - `StoreStatus` renders as a small floating banner (top-center) instead of pushing content.
- The map container grows to `h-[100dvh] w-full` (edge-to-edge), rounded corners removed or
  kept minimal on this route.
- Non-full-bleed routes (add-source, reports, warnings, …) keep the current padded layout.

### 2.2 Role-aware FAB quick actions

**File:** `frontend/src/routes/dashboard.map.tsx`.

Replace the top-right pill buttons with a bottom-right **FAB cluster**
(`absolute bottom-5 right-4 z-20 flex flex-col items-end gap-2`), one per role:

| Role | FAB actions |
| :--- | :--- |
| `citizen` | Report a problem (`/dashboard/reports`) · My location (fly to user) · Recenter |
| `official` | Add water source (`/dashboard/add-source`) · Recenter |
| `lgu` | Summary (opens overlay) · Issue advisory (`/dashboard/warnings`) · Demo controls (`/dashboard/settings`) · Recenter |
| `drrm` | Issue advisory (`/dashboard/warnings`) · Recenter |

- Main FAB button (plus icon) expands the cluster; actions are labelled buttons.
- Keep `MapControls` zoom (+ optional locate/fullscreen) — they don't collide with the FAB.
- "Recenter" re-runs the existing city-wide `fitBounds` (already implemented as "Show whole city").

### 2.3 Barangay info overlay — information-only side sheet

**File:** `frontend/src/routes/dashboard.map.tsx`.

- Keep the existing selected-brgy card (auto-zoom + info on click already work), but extend it
  to be a proper info-only sheet: name, access state, vulnerability, population, flow/quality,
  affordability, **that barangay's water sources** (kind + status), open reports count, and
  active alerts for it. Close button clears selection.
- No list of all barangays anywhere on the map. Search stays (top-left) as the only "browse"
  affordance, plus hover tooltips.
- Enrich the detail from `barangayDetail(domain, selected.psgc)` (already returns sources-free
  detail; add sources via `domain.sources.filter(a => a.barangayPsgc === selected.psgc)`).
- Optionally guard the orphan `/dashboard/sources` route (list of all barangays): remove it
  from the router or add a `beforeLoad` redirect to the map, to keep the "no all-barangays list"
  guarantee true everywhere.

### 2.4 Notifications — scoping polish

**Files:** `frontend/src/routes/dashboard.alerts.tsx`, `frontend/src/routes/dashboard.tsx`.

- Rename nav label **Alerts → Notifications** (keep path `/dashboard/alerts`; see decision D6).
- Nav **badge**: in `dashboard.tsx`, show a count pill = active alerts in the user's scope
  (citizen/official → own barangay; lgu/drrm → city-wide). Use `useDomain().activeAlerts` + the
  scoping helper extracted from `alerts.tsx`.
- Extract one shared scoping helper (e.g. `isInScope(alert, role, barangay)` in
  `lib/alerts.ts`) used by both the route and the nav badge, so the two never diverge.
- **Whole-city warnings**: scoped users currently drop alerts with `area === 'Catbalogan City'`.
  Include city-wide warning alerts for `citizen`/`official` too (their barangay is part of the
  city), keeping purely baranggay-scoped derived alerts to own barangay only. (Decision D7.)
- Keep LGU/DRRM city-wide (no change).

### 2.5 Reports — LGU/DRRM redirect

**File:** `frontend/src/routes/dashboard.reports.tsx`.

- Replace the `lgu`/`drrm` placeholder branch with a redirect to `/dashboard/map`
  (`<Navigate to="/dashboard/map" />` when `role === 'lgu' || role === 'drrm'`).
- No permission changes: RLS already limits insert to `citizen`/`official` (own barangay) and
  triage to `official` (own barangay).

### 2.6 Add-source — hardening + DRRM station decision

**Files:** `frontend/src/routes/dashboard.add-source.tsx`, `frontend/src/components/WaterAssets.tsx`.

- Confirm the form is the only add path and that `lgu` has no add affordance (true today).
- **Decision D3** — marker drag-to-move: recommend **keeping** it (owners reposition their own
  sources); the user's requirement is that *adding* isn't drag-based, which is already true.
- **Decision D4 / gap** — DRRM filling stations: `deliveries.tsx` says DRRM adds stations on the
  map, but no UI creates them. Options: (a) extend `add-source` so `drrm` opens it with
  `kind` locked to `station` (reuse form + location pick, gated by existing `CAN_PLACE.drrm`),
  or (b) explicitly drop station-placing from scope and adjust the Deliveries copy. Recommend (a).

### 2.7 Warnings surfacing

- No code change to `/dashboard/warnings`. Add the "Issue advisory" FAB entry (2.2) so it is one
  tap from the map. Authored warnings already merge into notifications.

## 3. Data & permission changes

None required for 2.1–2.5 (RLS already encodes the split: `water_sources` insert via
`can_place` = official own-brgy pump/well/reservoir or drrm station; `reports` insert =
citizen/official own-brgy; triage = official own-brgy; warnings author = lgu/drrm).
Only 2.6 option (a) relies on existing `CAN_PLACE.drrm` on the client — verify the `add-source`
route's guard becomes `role === 'official' || role === 'drrm'` with kind locked appropriately.

## 4. Implementation phases

1. **Phase A — Full-bleed map layout.** `staticData.fullBleed` on the map route; `dashboard.tsx`
   reads it; sidebar collapses to floating icon rail; padding removed; map fills viewport;
   `StoreStatus` floats. Non-map routes unchanged.
2. **Phase B — FAB quick actions.** Replace top-right pills with the role-aware bottom-right FAB
   cluster (2.2). Keep legend; keep search.
3. **Phase C — Info overlay enrichment.** Extend selected-brgy card with its sources, reports,
   alerts; guard/remove orphan `/dashboard/sources` route.
4. **Phase D — Notifications polish.** Extract scoping helper; rename nav label; add badge;
   include city-wide warnings for scoped users.
5. **Phase E — Reports + add-source hardening.** LGU/DRRM redirect on reports; add-source DRRM
   station option (decision D4); confirm no drag-add remains.
6. **Phase F — Docs & QA.** Update `docs/ux-revision-plan.md` to "implemented"; reconcile
   `docs/system-design.md` / `frontend/README.md` role matrix if touched; run `npm run
   typecheck`, `npm run lint`, `npm run build`; per-role smoke: citizen (map home, report FAB,
   own-brgy notifications), official (add-source, inbox, draggable own markers), lgu (full-bleed
   map, FAB summary/warnings, city-wide alerts), drrm (issue + resolve warning, deliveries if D4a).

## 5. Open decisions (confirm before build)

- **D2** — Full-bleed sidebar behavior: floating translucent icon rail (recommended) vs. hidden
  behind a menu button.
- **D3** — Keep drag-to-move for owners (recommended) vs. move-only-via-form.
- **D4** — DRRM station placement: extend the add-source form (recommended) vs. drop from scope.
- **D6** — Notifications route: keep `/dashboard/alerts` with renamed label (recommended) vs.
  move to `/dashboard/notifications` (new route + redirect from old).
- **D7** — Scoped users and city-wide warnings: show them (recommended — the city-wide warning
  covers their barangay) vs. hide them (strict "own barangay only").

## 6. Acceptance criteria

- `/dashboard/map` is edge-to-edge with a floating icon rail; every role lands there.
- Bottom-right FAB shows the correct actions per role; Recenter returns to city-wide fit.
- Clicking a barangay auto-zooms and opens an info-only overlay with its sources; no all-barangays
  list on the map.
- Nav shows "Notifications" with a badge equal to the scoped active count; citizens see own-brgy
  alerts plus city-wide warnings; LGU/DRRM see all.
- `lgu`/`drrm` hitting `/dashboard/reports` land on the map; citizens submit; officials triage.
- Adding a source is form-only (location pick/current location), official-only; LGU has no add UI.
- `typecheck`, `lint`, `build` green.

## 7. Out of scope

- No new Supabase tables or RLS policies beyond what exists.
- No push/SMS notifications (in-app, Realtime-backed only).
- Derived logic stays client-side pure functions.
