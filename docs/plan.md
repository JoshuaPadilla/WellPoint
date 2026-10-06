# WellPoint — Technical Plan

**Event:** rSCENE 2026 Hackathon — *Innovating Water Solutions for Stronger LGUs*
**Assigned challenge:** Challenge 5 — **Water Security** (`docs/draw_challenge.md`)
**Product:** **WellPoint** — a water-security access & early-warning platform for LGUs in Region VIII
**Tagline:** *See the gap between water that exists and water people can actually use.*

---

## 1. Problem

> Households in geographically isolated and underserved barangays of Catbalogan City and greater Region VIII cannot reliably access safe, affordable water — **even when a source exists nearby** — because LGU water offices lack one live picture of which systems are producing, which communities are cut off, and where quality is failing, especially when a typhoon, drought, or contamination event disrupts normal service.

The challenge statement is explicit: water security is an **access** problem, not an availability problem. A community can sit beside a river, spring, or reservoir and still be water-insecure (`docs/draw_challenge.md` §2, §5).

### Evidence / context

- "Water security means more than having a water source nearby." A community can have a source and still be insecure if it cannot reliably access sufficient, safe, affordable water (`draw_challenge.md` §2).
- Across Region VIII, communities differ in geography, settlement, infrastructure, and economy; some have reliable service while others face limited coverage, intermittent supply, seasonal shortages, or disaster disruption (`draw_challenge.md` §4).
- The gap is worst for geographically isolated, underserved, or economically constrained communities, or where extending infrastructure is hardest (`draw_challenge.md` §4).
- Six context areas must be reflected: climate/environmental risk, infrastructure & service coverage, water availability, community access, livelihoods/food security, and disasters/emergencies (`draw_challenge.md` §1).
- The challenge: bridge water **availability** and actual **equitable access**, especially under drought, disaster, contamination, or infrastructure failure (`draw_challenge.md` §5).

### Why now

Region VIII's economy leans on agriculture, fisheries, aquaculture, and natural-resource livelihoods, so water disruptions hit household income and food security directly (`hackathon_guidelines.md` §V.b). At the same time, LGUs are being asked to move toward higher service levels and smart systems while operating with thin budgets and limited technical staff (`§V.c`). A lightweight tool that makes the access gap visible — and predicts it before it becomes a crisis — is both timely and adoptable.

### Problem → solution chain (how the app closes the gap)

The core issue is that water **exists** near a community but people cannot reliably **access** it. Every feature traces to that gap, step by step:

1. **Model access, not availability.** For every barangay, access is measured as four queryable signals: service reach (system level + coverage), current reliability & safety (`available` / `flow` / `quality`), affordability, and resident reports. A barangay can be *covered by a system* yet still *insecure* — exactly the challenge's distinction.
2. **Know the place.** All 57 real barangay boundaries are imported, and isolation/structural vulnerability is **computed** from the actual polygons (area, distance from the Poblacion cluster) plus service level and source capacity — so "geographically isolated and underserved" is a derived property, not a label.
3. **One live picture.** The dashboard turns the four signals into KPI cards and a coverage map colored by **derived access state**, so the LGU sees who is secure, who is at risk, and *why*.
4. **Early warning before crisis.** Alerts derive from the same signals and are weighted by structural vulnerability, so warnings are forward-looking and explainable: *isolated barangay + Level I service + flow trending down → act now*.
5. **Communities as sensors.** Barangay officials submit reports that join to real places by barangay name and immediately re-derive alerts — the community feedback loop the challenge asks for.
6. **Equitable response.** Every alert names a plain-language action; response priority is severity-weighted and underserved-first, turning detection into fair relief.
7. **Proof under stress.** Simulating a typhoon, drought, or contamination drives the whole chain and shows it react; Reset demo restores a known-good state.

### Six context areas → concrete outputs

| Challenge context area | WellPoint input | Output surface |
| :--- | :--- | :--- |
| Climate & environmental risk | disruption types (typhoon/drought/contamination) + vulnerability tier | status band, risk flags |
| Infrastructure & service coverage | system service level, `flow`/`available` | coverage % + reliability KPIs, map color |
| Water availability | source status/capacity | source markers, shortage alerts |
| Community access | affordability, service hours, reports | derived access state, per-barangay 5-second answer |
| Livelihoods & food security | vulnerability tier × disruption severity | impact note on alerts ("disrupts fishing/farming income") |
| Disasters & emergencies | damage/no-water reports, disruption sim | outage alerts, emergency response priority |

---

## 2. Personas

We design the primary flow around the **LGU water office** persona, then serve the community reporting loop.

| # | Persona | Goals | Pain points |
| :-: | :--- | :--- | :--- |
| 1 | **LGU Water / Engineering Office Staff** *(primary)* | Know at a glance which systems and barangays are secure, at risk, or down; prioritize where to act first | Status spread across logs, radio calls, and field reports; no single live view; learns about outages from complaints |
| 2 | **Barangay Official / Community Leader** | Report outages, contamination, and low pressure; see their area's status; request help | No channel to report that reaches the water office with location and severity; no feedback loop |
| 3 | **Household / Community Member** | Simple answers: is my water available, safe, and affordable today? | Information is technical, absent, or arrives too late |
| 4 | **DRRM / Disaster Officer** | Early warning of water disruption; plan emergency water distribution | Alerts are reactive; no shared severity view across systems |

---

## 3. Judging alignment

Every Must-have feature maps to a scoring criterion. Features that do not score are cut.

### Level 1 — Technical Judges

| Criterion | Weight | How WellPoint scores it |
| :--- | :-: | :--- |
| **Feasibility & Implementability** | 40% | Frontend-only but real: a React SPA talks directly to Supabase (Postgres + Auth + Realtime), seeded deterministically client-side; one `npm run dev`; no external services beyond Supabase; deployable to a static host. |
| **Problem Relevance & Impact** | 25% | Directly models the access gap named in the challenge; surfaces served vs underserved barangays and predicts shortages. |
| **Technical Viability** | 15% | Typed domain model (`data/types.ts`), deterministic seed, documented derived-alert rules as pure client functions, `typecheck` + `build` green. |
| **Innovation & Creativity** | 10% | Fuses service status, source health, coverage, affordability, and community reports — plus real barangay geography — into one explainable early-warning view with a live "simulate disruption" demo. |
| **Sustainability & Scalability** | 10% | Data scoped by LGU/barangay; features are independent; plain web stack; documented production path. |

### Level 2 — Professional End-User Judges

| Criterion | Weight | How WellPoint scores it |
| :--- | :-: | :--- |
| **Technical Functionality & Feasibility** | 27% | One-command local start (`npm run dev`); deterministic client seed; "Reset demo" guarantees a clean run. |
| **Innovation & Creativity** | 17% | Explainable early warning: structural vulnerability (real geography) + live trend, not a black-box score. |
| **Relevance to Assigned Challenge** | 17% | Persona, place, and pain point are taken from the challenge text; local barangay names. |
| **User Experience & Design** | 13% | 5-second status answer, plain language, mobile-first, consistent labeled status colors. |
| **Scalability & Sustainability** | 13% | New LGUs are records, not forks; documented data sources and runbook. |
| **Presentation & Demonstration** | 13% | Scripted 5-minute demo with one live disruption and a rehearsed fallback. |

---

## 4. MVP scope

Bias hard toward **feasibility (40%)**: a smaller, fully working demo beats a broad, broken one.

### Must (demo cannot ship without)

1. **Water-security dashboard** — overall status banner for Catbalogan City plus KPI cards: coverage %, service reliability, active alerts, affordability indicator.
2. **Coverage & status view** — a map of **all 57 Catbalogan City barangays** (boundaries served from `frontend/public/catbalogan-brgys.geojson`, rendered with MapLibre), color-coded by **derived access state** (served / partial / underserved), with source markers, system service level (I/II/III), and a vulnerability tier per barangay.
3. **Alerts & early-warning list** — derived from documented thresholds, with severity, area, time, reason, and a recommended action.
4. **Community report submission** — area, type, description (3–4 fields) with a clear success confirmation; reports are saved to Supabase and feed the alert view live (Realtime).
5. **Live demo controls** — `Simulate disruption` (typhoon / drought / contamination / maintenance) and `Reset demo` returning to a known-good state.
6. **Deterministic seed data** — **57 real barangay boundaries** (PSGC-coded, with area km²), 4+ water sources, 5 pilot systems, structural vulnerability computed from the polygons, at least one active critical alert and one resolved alert.

### Should (only if Must is done and verified)

- Per-barangay drill-down detail with a short flow trend.
- Mark a report as acknowledged / resolved.
- Accessibility pass and a second browser smoke test.

### Won't (explicitly out of scope)

- Real multi-user role *management* (roles come from the Supabase `profiles` table; no admin UI in the prototype).
- Real map tile *provider* key (MapLibre uses Carto basemaps and degrades to a `blank` tile-less style offline).
- SMS/email notifications and a native mobile app.
- Live PAGASA/DOST or flow-meter telemetry ingestion (documented as the production path only).

---

## 5. Timeline (anchored to the official schedule)

Hacking begins **10:00 AM, Day 1 (Oct 6)**; Level 1 submission is **8:00 AM, Day 2 (Oct 7)**. Feature freeze at **T+22h**.

| Time | Milestone | Owner |
| :--- | :--- | :--- |
| T+0–2h | Plan + architecture locked; data types + seed frozen | all |
| T+2–10h | Frontend: seed (5 systems + 57 barangays), derived alerts/metrics/vulnerability, Supabase schema | frontend lead |
| T+4–12h | Dashboard KPIs/banner, report CRUD + Realtime, demo controls wired | frontend lead |
| T+10–18h | Coverage view (57 brgys), alerts, reports; UX pass | frontend lead |
| T+18–22h | QA: fresh-seed boot, Reset demo, smoke tests, **feature freeze** | QA lead |
| T+22–24h | Deck + demo rehearsal; submit by 8:00 AM | all |

---

## 6. Proposed tech stack

The repo is a **React 19 + TanStack Router (Vite 8) SPA** in `frontend/` that talks **directly to Supabase** — there is no backend. We build a working prototype on that boundary: a deterministic client-side seed feeds pure derived functions, and Supabase provides persistence, authentication, and realtime.

| Layer | Choice | Why |
| :--- | :--- | :--- |
| Frontend framework | **React 19 + TanStack Router** (file-based routes) | Already scaffolded; type-safe routing. |
| Frontend UI | **shadcn/ui** (Tailwind CSS v4 + Radix/Base UI) | Accessible, mobile-first components; looks professional on demo day. |
| Build | **Vite 8** | Fast dev server on port 3000, small production bundle. |
| Database / auth | **Supabase** (Postgres + Auth + Realtime) | Managed Postgres, email/password auth, realtime subscriptions out of the box. |
| Data access | **`@supabase/supabase-js`** + one `useSyncExternalStore` store | `water_sources` and `reports` sync with debounced `postgres_changes` reloads. |
| Domain model | **TypeScript** (strict) — `frontend/src/data/types.ts` | One typed contract shared by seed, store, derived logic, and UI. |
| Derived logic | **Pure TypeScript functions** in `frontend/src/lib/{alerts,metrics,vulnerability}.ts` | Deterministic, testable, explainable; no server required for the prototype. |
| Maps | **MapLibre GL** (Carto basemaps; `blank` mode for offline) | Real PSGC-coded polygons; degrades to a tile-less style without Wi-Fi. |
| Data | **Deterministic client seed** (`baseSeed = 20261006`) | Identical state every demo; `Reset demo` restores it. |
| Quality | **ESLint + Prettier + `tsc --noEmit`** | Green `typecheck` and `build` are a submission requirement. |
| Local run | **`npm run dev`** in `frontend/` + a Supabase project | One command start; deterministic; works without venue Wi-Fi once Supabase is reachable. |
| Deploy | **Static host + Supabase** | Near-zero cost, one project to maintain. |

**Production path (documented, not built):** keep the same types and derived functions, then add live telemetry ingestion (flow meters, PAGASA/DOST feeds) as scheduled Edge Functions, multi-LGU scoping, and role management — the UI is unchanged.

See `docs/architecture.md` for the system diagram, data model, derived-alert rules, feasibility, and scalability arguments.
