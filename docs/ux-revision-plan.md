# WellPoint — UX & IA Revision Plan

Status: **proposed — not yet implemented.** This plans a role-based information
architecture and a map-first experience. It supersedes the navigation choices in
the current build; the data model from `docs/revision-plan.md` stays.

## 1. Requested changes — validation

| # | Request | Verdict | Current state |
| :-: | :--- | :--- | :--- |
| 1 | Members have **no dashboard**; the **map is their home**, showing water sources | **Change** | `/dashboard` renders KPI cards + role views for everyone; the map is a sub-route |
| 2 | The map **side sheet is information-only**, not a list of all barangays | **Change** | The sheet lists all 57 barangays when nothing is selected |
| 3 | Notifications are **scoped to the user's barangay**; city-wide only for the LGU admin | **Partial** | Alerts route has a manual "Only Brgy X" checkbox; default is city-wide for all |
| 4 | **LGU has no reports screen**; brgy leaders get an **inbox**; members get a **submit form** | **Change** | Reports route shows a form (lgu/official) + a global list to everyone; members cannot submit |
| 5 | **Adding a water source is brgy-leader-only**, via a **form** (current location / map point), **not drag-and-drop** | **Change** | Drag-drop palette; lgu/official/drrm can place; no form |
| 6 | **DRRM can issue advisories/warnings** | **Done** | `/dashboard/warnings` exists (lgu + drrm) — keep, surface more clearly |
| 7 | **LGU map**: full-screen, **FAB** quick actions, barangay **info overlays**, city-wide default, **auto-zoom on select** | **Partial** | Map is `70vh` in a padded layout, has a list sheet, no FAB; initial fit + click-zoom already work |

## 2. Target information architecture (per role)

Nav is filtered by role. "Home" is where the user lands after login.

| Surface | `citizen` (member) | `official` (brgy leader) | `lgu` (admin) | `drrm` |
| :--- | :-: | :-: | :-: | :-: |
| **Map** | **home** | ✅ | ✅ **full-screen** | ✅ |
| Dashboard (KPIs) | — | ✅ (own brgy) | ✅ (city-wide) | ✅ (city-wide) |
| Notifications | ✅ own brgy | ✅ own brgy | ✅ city-wide | ✅ city-wide |
| Reports | ✅ **submit form** | ✅ **inbox** | — | — |
| Add water source | — | ✅ **form (FAB)** | — | station only *(decision D4)* |
| Warnings / advisories | — | — | ✅ | ✅ |
| Users & roles | — | — | ✅ | — |
| Water sources list | ✅ "Find water" | ✅ manage | ✅ view | ✅ view |
| Deliveries | — | — | ✅ | ✅ |
| Demo controls | — | — | ✅ | ✅ |

Landing rules: `citizen` → `/dashboard/map`; everyone else → `/dashboard`.

## 3. Detailed specifications

### 3.1 Map (shared) — information-only sheet

- Remove the **all-barangays list** from the sheet. The sheet renders **only the selected barangay's** detail (access state, population, affordability, flow/quality, vulnerability breakdown, open reports, alerts, and its water sources).
- Selection comes from **clicking the polygon** (which auto-zooms) or the **search box**. Nothing selected → the sheet is closed (desktop shows a compact info overlay instead).
- Keep the search (top-left), legend (access-state colors), and the base map controls.

### 3.2 Citizen home = map

- `dashboard.index` **redirects citizens to `/dashboard/map`**.
- The citizen map emphasizes **available water sources**: working source markers are prominent; tapping one shows its name, kind, status, and barangay.
- A compact bottom card answers the 5-second question: *"Your barangay: Served / Partial / Underserved"* (from `profiles.barangay_psgc`).
- No KPI dashboard, no internal metrics for citizens.

### 3.3 Notifications (role-scoped)

- Rename the surface to **Notifications** (route can stay `/dashboard/alerts` or move to `/dashboard/notifications`).
- **Scope by role by default** (no manual toggle needed):
  - `citizen` / `official` → only alerts whose `area` is their barangay.
  - `lgu` / `drrm` → all active alerts (city-wide), with the underserved-first priority order.
- Add a **badge** on the nav item = count of active alerts in scope.
- The dashboard banner/KPI alert counts use the same scope (LGU city-wide; others own brgy).

### 3.4 Reports — role-split

| Role | `/dashboard/reports` renders |
| :--- | :--- |
| `citizen` | **Submit form** only: barangay (fixed to own), type, description → insert to `reports`. Confirmation on success. |
| `official` | **Inbox** for own barangay: list of reports with status badges, **Acknowledge** / **Resolve** actions. (No submit form.) |
| `lgu` / `drrm` | Not in nav; direct hit redirects to the map. |

- **Only residents/users submit** reports. Barangay leaders **read and triage** them — they are **not** the submitters. (Today the build has it backwards: officials/LGU submit and residents cannot.)
- Reports still feed the derived alert read model (a `new` report raises an alert), so the LGU still sees the consequence on the map/notifications without a reports screen.

### 3.5 Add water source — brgy-leader-only form

- **Barangay leaders add sources to their own barangay** (the LGU cannot add sources). This fixes the current flow where the drag-and-drop palette + `onDrop` resolve the drop point's barangay, so an add outside the leader's own barangay is rejected by RLS and the leader has no reliable way to add.
- **Remove the drag-and-drop palette** (`RolePanel`) and the map `onDrop` handler.
- New **"Add water source" form** (official only), fields:
  - Name (text), Kind (`pump` / `well` / `reservoir`), Status (`ok` / `low` / `empty` / `repair` / `unsafe`), Notes (optional).
  - **Location**: "Use my current location" (`navigator.geolocation`) **or** "Pick on map" (enter pick-mode; the next map click sets the point) **or** manual lat/lng.
  - Barangay is **fixed to the official's `barangay_psgc`** (never client-chosen).
- Submit → insert into `water_sources` with `barangay_psgc = user's barangay`; the marker appears on the map.
- Entry points: a **FAB action** on the map ("Add water source") and a button on the sources list.

### 3.6 DRRM warnings (keep, surface)

- Keep `/dashboard/warnings` (issue + resolve/cancel, target barangays, severity).
- Add it to the **DRRM/LGU FAB** as "Issue advisory / warning" so it is one tap away from the map.
- Authored warnings remain merged into the notifications read model (tagged `source: 'authored'`).

### 3.7 LGU map redesign (full-screen)

- **Full-bleed layout**: the map route occupies the whole viewport. Introduce a route-level `fullBleed` flag (via TanStack Router `staticData`) that the dashboard layout reads to drop the page padding and let the map fill `100dvh`.
- **Sidebar**: collapses to the icon rail automatically on the map route (or floats as a translucent overlay) so the map is edge-to-edge.
- **FAB** (bottom-right, role-aware quick actions):
  - `lgu`: Simulate disruption · Reset demo · Issue advisory · Recenter.
  - `official`: Add water source · Report an issue.
  - `drrm`: Issue advisory · Add station *(decision D4)* · Recenter.
  - `citizen`: Report an issue · My location.
- **Info overlays**: a translucent card (bottom-left on desktop, bottom sheet on mobile) for the selected barangay — name, access state, population, vulnerability, active alerts, and its sources. No list of all barangays.
- **Zoom behavior**: default is **city-wide** (initial `fitBounds`); clicking/selecting a barangay **auto-zooms** to it and opens its overlay; a "Recenter" FAB action returns to city-wide.

## 4. Data & permission changes

No new tables. Changes to `supabase/schema.sql` policies and the client maps:

| Change | Detail |
| :--- | :--- |
| `reports` insert | Allow `citizen` **and** `official`, forced to `barangay_psgc = user_barangay()`. |
| `reports` update/delete | `official` own barangay; `lgu` may keep admin override. |
| `can_place(kind, psgc)` | `official` → `pump`/`well`/`reservoir` (own barangay); `drrm` → `station`; **remove `lgu`**. |
| `can_set_status(kind, psgc)` | unchanged: `lgu` all, `official` pump/well own, `drrm` station. |
| Client `CAN_PLACE` | Mirror the above; drives the form visibility and FAB. |
| Types | No structural change; the UI renames "Alerts" → "Notifications". |

## 5. Open decisions (confirm before build)

- **D1 — "user" scope:** assume *user = citizen*; `official` keeps a (brgy-scoped) dashboard. Confirm if officials should also be map-first.
- **D2 — full-screen map + sidebar:** assume the sidebar auto-collapses to the icon rail on the map route. Alternative: hide it entirely behind a menu button.
- **D3 — moving markers:** adding becomes a form; assume **drag-to-move stays** for the owner. Alternative: edit position only through the form.
- **D4 — DRRM stations:** assume DRRM keeps adding filling stations (via the same form); otherwise restrict add strictly to `official` water sources.
- **D5 — LGU report visibility:** assume LGU has **zero** report UI (sees only the derived alerts). Confirm if LGU needs a read-only report feed somewhere.
- **D6 — Notifications route name:** assume we rename the label to "Notifications" but keep the `/dashboard/alerts` path (or move to `/dashboard/notifications`).

## 6. Implementation phases

1. **Phase A — IA & routing.** Role-based landing (`citizen` → map), role-filtered nav, route guards, `fullBleed` layout flag. Update `dashboard.tsx`.
2. **Phase B — Reports role-split.** Citizen submit form; official inbox; hide for lgu/drrm; RLS insert for citizen. Update `dashboard.reports.tsx` + `schema.sql`.
3. **Phase C — Add water source form.** Remove drag palette + `onDrop`; build the form (current location / map pick / manual); official-only; RLS `can_place`. Update `WaterAssets.tsx`, `dashboard.map.tsx`, `water-store.ts`, `schema.sql`.
4. **Phase D — Notifications scoping.** Default scope by role, nav badge, scoped dashboard counts. Update `dashboard.alerts.tsx`, `dashboard.index.tsx`, `dashboard.tsx`.
5. **Phase E — Map redesign.** Full-screen layout, FAB (role-aware), info overlays, remove the all-barangays list, auto-zoom polish. Update `dashboard.map.tsx`, `WaterAssets.tsx`.
6. **Phase F — Warnings surfacing.** Keep `/dashboard/warnings`; add FAB entry; verify authored warnings merge into notifications.
7. **Phase G — Docs & QA.** Reconcile `docs/system-design.md` (Part 1 matrix), `docs/architecture.md` §6, `frontend/README.md`; run `typecheck` + `build` + lint + a fresh-seed smoke test per role.

## 7. Out of scope

- No new backend — Supabase (Postgres + Auth + Realtime + RLS) stays the data tier.
- Derived logic stays client-side pure functions.
- No push notifications / SMS; the "notification" surface is in-app (Realtime-backed).
