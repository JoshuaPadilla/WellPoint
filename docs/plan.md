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
| **Feasibility & Implementability** | 40% | Static client-only app, no DB, no server, no hardware; runs offline from bundled deterministic seed data; deployable to any static host or an LGU laptop. |
| **Problem Relevance & Impact** | 25% | Directly models the access gap named in the challenge; surfaces served vs underserved barangays and predicts shortages. |
| **Technical Viability** | 15% | Typed domain model, pure deterministic simulation, documented derived-alert rules, route-based architecture, lint + build green. |
| **Innovation & Creativity** | 10% | Fuses service status, source health, coverage, affordability, and community reports into one explainable early-warning view with a live "simulate disruption" demo. |
| **Sustainability & Scalability** | 10% | Data scoped by LGU/barangay; features are independent; plain web stack; documented production path. |

### Level 2 — Professional End-User Judges

| Criterion | Weight | How WellPoint scores it |
| :--- | :-: | :--- |
| **Technical Functionality & Feasibility** | 27% | Deterministic demo that never depends on venue Wi-Fi; "Reset demo" guarantees a clean run. |
| **Innovation & Creativity** | 17% | Explainable thresholds + predictive warning rather than a black-box score. |
| **Relevance to Assigned Challenge** | 17% | Persona, place, and pain point are taken from the challenge text; local barangay names. |
| **User Experience & Design** | 13% | 5-second status answer, plain language, mobile-first, consistent labeled status colors. |
| **Scalability & Sustainability** | 13% | New LGUs are records, not forks; documented data sources and runbook. |
| **Presentation & Demonstration** | 13% | Scripted 5-minute demo with one live disruption and a rehearsed fallback. |

---

## 4. MVP scope

Bias hard toward **feasibility (40%)**: a smaller, fully working demo beats a broad, broken one.

### Must (demo cannot ship without)

1. **Water-security dashboard** — overall status banner for Catbalogan City plus KPI cards: coverage %, service reliability, active alerts, affordability indicator.
2. **Coverage & status view** — a lightweight schematic map / coverage grid of 5 Region VIII barangays showing **served vs underserved**, source markers, and system service level (I/II/III).
3. **Alerts & early-warning list** — derived from documented thresholds, with severity, area, time, reason, and a recommended action.
4. **Community report submission** — area, type, description (3–4 fields) with a clear success confirmation; reports feed the alert view.
5. **Live demo controls** — `Simulate disruption` (typhoon / drought / contamination / maintenance) and `Reset demo` returning to a known-good state.
6. **Deterministic seed data** — 5 barangays, 4+ sources, 5 systems, households, at least one active critical alert and one resolved alert.

### Should (only if Must is done and verified)

- Per-barangay drill-down detail with a short flow trend.
- Mark a report as acknowledged / resolved.
- Accessibility pass and a second browser smoke test.

### Won't (explicitly out of scope)

- Real authentication, real database, or a separate backend service.
- Real map tile provider (schematic grid is safer and offline-proof).
- SMS/email notifications and a native mobile app.
- Live PAGASA/DOST or flow-meter integration (documented as the production path only).

---

## 5. Timeline (anchored to the official schedule)

Hacking begins **10:00 AM, Day 1 (Oct 6)**; Level 1 submission is **8:00 AM, Day 2 (Oct 7)**. Feature freeze at **T+22h**.

| Time | Milestone | Owner |
| :--- | :--- | :--- |
| T+0–2h | Plan + architecture locked; data contracts frozen | all |
| T+2–10h | Data layer + dashboard working with seed data | data/dev lead |
| T+10–18h | Coverage view, alerts, reports, demo controls; UX pass | frontend lead |
| T+18–22h | QA, offline/fallback checks, **feature freeze** | QA lead |
| T+22–24h | Deck + demo rehearsal; submit by 8:00 AM | all |

---

## 6. Proposed tech stack

The repo is already scaffolded as a **TanStack Router (React 19) client-only SPA** — there is no server runtime installed. That is the right call for this challenge: the app must render with **no network and no database**, and a static SPA is the most reliable thing to demo and deploy.

| Layer | Choice | Why |
| :--- | :--- | :--- |
| Framework | **React 19 + TanStack Router** (file-based routes) | Already scaffolded; type-safe routing; no server runtime to break. |
| Build | **Vite 8** | Fast dev server on port 3000, tiny static build. |
| Language | **TypeScript 6** (strict) | Stable data contracts the UI and simulator share. |
| Styling | **Tailwind CSS v4** | Mobile-first utilities; no heavy UI library. |
| State | **React `useSyncExternalStore`** module store | Zero dependencies; shared live state across routes. |
| Data | **Bundled deterministic seed + pure simulator** | Offline-proof; identical on every run. |
| Charts | **Hand-rolled inline SVG sparklines** | Avoids a chart dependency; fast first paint. |
| Quality | **ESLint + Prettier + `vite build`** | Green build is a submission requirement. |
| Deploy | **Static host** (Netlify / Vercel / Cloudflare Pages / GitHub Pages) or an LGU laptop | No server, no cost, works on venue Wi-Fi or offline. |

**Production path (documented, not built):** swap the client data layer for a thin API (Node/Fastify or TanStack Start server functions) backed by PostgreSQL, fed by LGU flow-meter records and PAGASA/DOST feeds; keep the same entity/API contracts so the UI is unchanged.

See `docs/architecture.md` for the system diagram, entity schemas, derived-alert rules, feasibility, and scalability arguments.
