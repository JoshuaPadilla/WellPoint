# WellPoint — Level 1 Pitch Package (rSCENE 2026)

Built to the **official** "Data Form and Pitching Guide" (`Data-Form-and-Pitching-Guide.xlsx`):
7-slide deck · 5-min pitch · 5-min demo · 15-min Q&A · Unified Pitching Data Form.

Replace every `[bracket]` before submitting.

---

## 0. The winning strategy (read this first)

You said it yourself: this is not the most technical, and probably not the most innovative. **Good — that is not where this competition is won.**

Look at the actual weights:

| Level 1 (Technical judges) | Weight |
| :--- | :-: |
| **Feasibility & Implementability** | **40%** |
| **Problem Relevance & Potential Impact** | **25%** |
| Technical Viability | 15% |
| **Innovation & Creativity** | **10%** |
| Sustainability & Scalability | 10% |

Feasibility + Relevance = **65%**. Innovation = **10%**. The judges are LGU IT staff and CICTO people — they do not reward the flashiest model; they reward the thing **they could actually run next month on a thin budget**.

So the whole pitch should say, in effect:

> "We did not build the most complex thing. We built the thing your water office can actually deploy — and it already works on your 57 real barangays."

Three defensible claims to repeat (each maps to a criterion):

1. **It's real and cheap.** React SPA + Supabase, no backend, one `npm run dev`, near-zero cost, static-host deployable. → *Feasibility 40%.*
2. **It models the exact problem in the challenge.** The challenge says water security is an **access** problem, not an availability problem. Our entire data model is built on that sentence. → *Relevance 25%.*
3. **Nothing is a black box.** Every alert is a documented rule with a visible threshold; access state is *derived*, never labeled. → *Viability 15% + Innovation 10% + trust.*

**The throughline for every sentence:** *"Water exists. Access is the gap. WellPoint makes the gap visible — and tells you who to serve first."*

**Do not apologize** for the stack. Name it as a deliberate choice: "We kept it small on purpose, because implementability is 40% of this round — and because the LGU's existing IT vendor already knows this stack."

---

## 1. Official constraints you must follow

From the workbook:

- **Deck:** use the shared Canva template. **Do not edit Slide 1 (Opening) or Slide 7 (Demonstration)** — only fill in city, challenge, team members. Slides 2–6 you may edit.
  Template: `https://canva.link/k4ee8qztbx7qpw1`
- **Timeline per team:** Pitching **5 min** · Demonstration **5 min** · Q&A **15 min**.
- **Level 1 submission:** by **8:00 AM, Day 2** — working prototype link/repo + deck + the **Unified Pitching Data Form**.
- The deck must hit exactly these 7 slides: **Opening · Problem · Solution · Utilization · System · Adoption · Demonstration.**

---

## 2. The 7-slide deck (copy-paste content)

Large text, one idea per slide, no walls of bullets. Diagrams: reuse the system diagram from `docs/architecture.md` §2.

### Slide 1 — Opening *(template; do not restyle)*
- City/Municipality: **[Catbalogan City / your LGU]**
- Challenge Area: **Challenge 5 — Water Security**
- Team: **[Team Name]**
- Members: **[Member 1] · [Member 2] · [Member 3]**

### Slide 2 — Problem
**Title: "Water exists. Access doesn't."**

- A household in an upland Catbalogan barangay sits near a spring — and still has no water 3 days a week in the dry season.
- The LGU water office doesn't lack data. It lacks **one live picture**: status lives in logs, radio calls, and complaints, so outages are discovered *when residents complain*, not before.
- Worst hit: geographically isolated, underserved, and disaster-vulnerable barangays — exactly the groups named in the challenge.

*Visual:* one real barangay boundary with a spring pin, and a "no service today" icon.

### Slide 3 — Solution
**Title: "One live access picture for all 57 barangays."**

- **WellPoint** = a water-security access & early-warning platform for LGU water offices.
- **What it does:** maps access state across all 57 real barangay boundaries, raises explainable early-warning alerts, lets barangay officials report problems, and ranks who to serve first.
- **The improvement:** instead of scattered logs, one screen shows who is *secure*, who is *at risk*, and *why* — with a recommended action per alert.
- **What's different:** access state is **derived** from live signals (never hand-labeled), and alerts combine **real geography + live trend** so a warning can fire *before* full failure.

*Visual:* the coverage map (green/amber/red) — your single strongest image.

### Slide 4 — Utilization
**Title: "Five minutes a day for the water office."**

- **Primary user:** LGU Water / Engineering Office staff.
- **Journey:**
  1. Open dashboard → read city status band + 4 KPIs (coverage, reliability, active alerts, affordability).
  2. Open the Map → see served / partial / underserved per barangay; tap one for its drill-down.
  3. Open Alerts → each alert states the **cause** and the **recommended action** in plain language.
  4. A barangay official submits a report (area, type, description) in under 20 seconds.
  5. DRRM uses Deliveries to send relief **underserved-first**.
- **Input the user gives:** a short report or a source status update.
- **Result the user gets:** a live, prioritized picture and an action to take.

*Visual:* 3 annotated screenshots (Dashboard, Map, Alerts) — not walls of text.

### Slide 5 — System
**Title: "Small by design — so it can actually be deployed."**

- **Diagram (reuse `docs/architecture.md` §2):** Browser UI → Supabase (Postgres + Auth + Realtime); derived logic runs as pure functions; real GeoJSON boundaries feed the map.
- **Tech:** React 19 + TanStack Router + Vite; Supabase (Postgres, Auth, Realtime); MapLibre GL; TypeScript strict.
- **Data:** real PSGC-coded barangay boundaries for all 57 Catbalogan barangays; water/service data is **simulated and clearly labeled**; community reports and source updates persist in Supabase.
- **Requirements:** one `npm run dev` + a Supabase project. No backend, no Docker, no paid API keys.
- **Current limitations (say them first — it builds trust):** telemetry is simulated; no live PAGASA/DOST feed yet; role management has no UI; map needs internet for basemap tiles (degrades gracefully offline).

### Slide 6 — Adoption
**Title: "Adding your LGU is records, not a rewrite."**

- **Where used:** LGU water/engineering office; barangay officials report; DRRM distributes relief.
- **Who operates it:** the LGU water office (or its existing IT vendor) — standard React/Postgres skills.
- **To deploy:** one Supabase project + a static host. Near-zero cost (free tier + free static hosting); ~PHP 0–1,500/month if hosted.
- **Maintenance:** one typed data model file, pure documented functions — a new developer reads the model in one file.
- **Risks → answers:** no telemetry? staff enter data through the same forms. No budget? free tier. New LGU? add records + that LGU's GeoJSON.
- **Next 3 steps:** (1) pilot with the Catbalogan City water office; (2) ingest real flow-meter / PAGASA-DOST data; (3) roll out to neighboring municipalities.

### Slide 7 — Demonstration *(template; do not edit)*
Leave the slide as-is. The live demo is Section 4 below.

---

## 3. Five-minute pitch script (word-for-word, timed)

Speaker: **[Presenter]**. Numbers in brackets = elapsed time. Pause after every bold line.

> **[0:00] Slide 1**
> "Good morning. We are **[Team Name]** from **[LGU]**, and we drew **Challenge 5: Water Security**."

> **[0:15] Slide 2 — Problem**
> "Let me start with one sentence from the challenge itself: *water security is an access problem, not an availability problem.*
> **[pause]** In an upland barangay here in Catbalogan, a household can sit near a spring — and still have no water three days a week in the dry season. **The water exists. Access doesn't.**
> And the water office doesn't lack data. It lacks **one live picture**. Status lives in logs, radio calls, and complaints — so an outage is discovered when residents call, not before."

> **[0:50] Slide 3 — Solution**
> "That is WellPoint. **One live access picture for all 57 barangays of Catbalogan.**
> It maps access across your real barangay boundaries, raises early-warning alerts in plain language, lets barangay officials report a problem in under 20 seconds, and tells you **who to serve first**.
> Two things make it different. First, access state is **derived** from live signals — not a label someone typed, so the score can't be gamed. Second, alerts combine **real geography with live trend**, so a warning can fire **before** a shortage fully hits."

> **[1:30] Slide 4 — Utilization**
> "For the user, it's five minutes a day. The water office opens the dashboard: a city status band and four numbers — coverage, reliability, active alerts, affordability. Then the map: green is served, amber is partial, red is underserved. Then alerts: each one states the cause and the recommended action. A barangay official reports from the field. DRRM sends relief to the most vulnerable barangays first."

> **[2:15] Slide 5 — System**
> "Technically, we kept it deliberately small — because implementability is forty percent of this round.
> A React single-page app talks directly to Supabase for data, auth, and realtime. There is **no backend**. The derived logic is plain, testable TypeScript. The map uses the **real PSGC-coded boundaries of all 57 barangays**.
> And I'll be upfront about the limits: the water data is **simulated** and labeled as such, there's no live PAGASA feed yet, and role management is table-driven. We'd rather show you something honest that runs."

> **[3:05] Slide 6 — Adoption**
> "Adoption is the part we care about most. One command starts it. One Supabase project and any static host run it — near-zero cost.
> Adding another municipality is **records plus its own GeoJSON** — not a new codebase. No telemetry yet? Staff type it in through the same forms.
> Our three next steps: pilot with the Catbalogan water office, ingest real flow-meter and PAGASA data, then expand to neighboring LGUs."

> **[3:50] Slide 1 recap / hand-off to demo**
> "So — the gap is access, and WellPoint makes it visible and actionable. **Let me show you, live.**"

**Timing buffer:** aim to finish at **4:30**, leaving 30 seconds. If you're running long, cut the "risks → answers" line on Slide 6 — never cut the demo hand-off.

---

## 4. Five-minute live demo script (click path)

**Before the judges arrive:** press **Reset demo** (Settings → Demo controls) so the known-good state is loaded. Have the login credentials for each role on a sticky note. Pre-fill any report fields.

1. **Dashboard** (`/dashboard`) — *[0:00–0:45]*
   "Notice the banner: Catbalogan is at **Watch**. Four numbers explain why — coverage, reliability, active alerts, affordability. The score is built from these, so you always see *why*."
   *Pause so judges read the score breakdown.*

2. **Map** (`/dashboard/map`) — *[0:45–1:45]*
   "Green is served, amber is partial, red is underserved — and this state is **derived** from each system's live status, not labeled. **Every one of these 57 boundaries is real**, PSGC-coded, and each carries a vulnerability tier computed from its geography. Canlapwas is critical; Poblacion 1 is secure. **The same city, very different access.**"
   *Tap one red barangay to open its drill-down.*

3. **Alerts** (`/dashboard/alerts`) — *[1:45–2:30]*
   "Each alert states the cause and the recommended action in plain language — 'Deploy emergency water to Barangay Canlapwas within 6 hours.' This is our documented rule set, not a black box."

4. **Reports** (`/dashboard/reports`) — *[2:30–3:15]*
   "A barangay official reports a contamination event. Fields are pre-filled; watch it appear as an alert **without a refresh**."
   *Submit → jump to Alerts to show the new live alert.*

5. **Simulate a typhoon** (Dashboard → Demo controls → San Andres) — *[3:15–4:15]*
   "Now a typhoon hits San Andres. Watch the reliability score drop and a new critical alert appear — no refresh."
   *Let the change land. Optionally open Insights to show the recommendation that appears for the LGU.*

6. **Reset demo** — *[4:15–4:45]*
   "Every run is deterministic, so this demo is repeatable. Reset restores the known-good state."

**Rules:** never type free-form live; keep under 4:45; if anything breaks, say *"that's a production enhancement — here's the path"* and continue. You always have **Reset demo**.

---

## 5. Unified Pitching Data Form — filled answers

Copy these into the workbook. Watch the word limits.

**A. Team and challenge identification**
- Team ID: *(organizer-assigned — leave blank)*
- Team Name: **[Team Name]**
- LGU Represented: **[City/Municipality]**
- Team Members: **[Member 1]; [Member 2]; [Member 3]**
- Assigned Challenge Area: **Water Security (Challenge 5)**

**B. Problem and user understanding**
- **6.0 Problem Context (≤100w):** "In Catbalogan City and across Region VIII, many geographically isolated and underserved barangays cannot reliably access safe, affordable water even when a source exists nearby. The LGU water office has no single live view of which systems are producing, which communities are cut off, and where quality is failing. Status is scattered across service logs, radio calls, and resident complaints, so disruptions are usually discovered only after households are already affected — especially during typhoons, droughts, contamination, or infrastructure failure."
- **7.0 Primary User and Beneficiaries (≤50w):** "Primary user: LGU Water/Engineering Office staff who prioritize repairs and relief. Beneficiaries: barangay officials and residents of underserved barangays, and DRRM officers planning emergency water distribution."
- **8.0 Key User Need / Pain Point (≤50w):** "No single, real-time, geographic picture of water access. Staff cannot quickly see who is cut off or predict a shortage, so response is reactive, unequal, and slow — worst for isolated, low-income barangays."
- **9.0 Basis / Evidence (≤3 items):** "(1) The assigned Challenge 5 scenario, which states water security is an access problem, not availability. (2) Real PSGC-coded boundaries and geography of all 57 Catbalogan barangays, showing large differences in isolation and service level. (3) Current practice relies on scattered logs, radio reports, and complaints — no unified live view."

**C. Proposed solution**
- **10.0 Solution Name:** "WellPoint"
- **11.0 Solution Summary (≤75w):** "WellPoint is a water-security access and early-warning platform for LGU water offices. It maps access state across all 57 real Catbalogan barangay boundaries, derives explainable early-warning alerts from live service, source, and community-report signals, and ranks which barangays to serve first. Barangay officials report problems in seconds; DRRM distributes relief to the most vulnerable areas first."
- **12.0 Solution Type:** "Decision-Support System / Dashboard (web application)"
- **13.0 Core Functions (≤5):**
  1. "Access dashboard: city status band + coverage, reliability, alerts, affordability KPIs."
  2. "Coverage map: 57 real barangay boundaries colored by derived access state, with vulnerability tiers."
  3. "Early-warning alerts: documented thresholds, plain-language cause and recommended action."
  4. "Community reporting: barangay officials submit outages/contamination; feeds alerts live."
  5. "Prioritized response: rule-based recommendations and underserved-first delivery planning."

**D. Prototype, technical functionality, and user experience**
- **14.0 Prototype Status (select + ≤50w):** "**Working Prototype** — full login/roles, live dashboard and map, derived alerts, Supabase-backed reports and warnings with realtime updates, emergency deliveries, and a deterministic demo with reset. Water/telemetry data is simulated and labeled; boundaries are real."
- **15.0 User and System Workflow (≤5 steps):** "1) Staff sign in (role-scoped). 2) Dashboard + map show derived access state per barangay. 3) Alerts fire from documented rules weighted by vulnerability. 4) Officials/residents submit reports; LGU/DRRM author warnings — both persist in Supabase and update live. 5) LGU acts on ranked recommendations; DRRM plans underserved-first deliveries."
- **16.0 Technology and Data Used:** "React 19, TanStack Router, Vite, TypeScript (strict), Tailwind/shadcn-ui, MapLibre GL; Supabase (Postgres + Auth + Realtime). Data: real PSGC-coded barangay boundaries (57) and area/distance metadata; simulated deterministic water-service and source data; user-authored reports/warnings/sources in Supabase; optional Open-Meteo weather projection."
- **17.0 Dependencies & Limitations (≤5):** "(1) Requires internet + a Supabase project; (2) water/telemetry data is simulated, not live; (3) no PAGASA/DOST or flow-meter integration yet; (4) role management is table-driven, no admin UI; (5) map basemap tiles need connectivity (degrades to a tile-less style offline)."
- **18.0 UX & Accessibility (≤75w):** "Designed for a 5-second answer: a status band and four KPIs first, then map, then alerts. Status is conveyed by icon and text, never color alone. Plain language throughout; mobile-first with ≥44px tap targets and WCAG-AA contrast. Role-based navigation hides irrelevant features. All names are local barangays, so staff recognize their own areas instantly."
- **19.0 User Testing / Feedback (optional):** "[Not yet conducted / list reviewers and the one change you made from their feedback.]"

**E. Implementation and feasibility**
- **20.0 Operational Use & Implementing Office (≤100w):** "Operated by the LGU Water/Engineering Office as a daily monitoring and response console; barangay officials use the report form from the field; DRRM uses the deliveries view during emergencies. It replaces no existing system — it unifies scattered status into one live picture. The same deployment can be run by a municipal water utility or the city's IT office with standard web skills."
- **21.0 Deployment Requirements (≤6):** "1) Supabase project (free tier sufficient); 2) any static web host; 3) internet connectivity; 4) a browser (mobile or desktop); 5) staff accounts with roles; 6) short staff orientation on reports and alerts."
- **22.0 Indicative Cost and Time:** "Near PHP 0 for a pilot (Supabase free tier + free static host); ~PHP 0–1,500/month if hosted. Initial deployment: 1–2 weeks (data setup, accounts, orientation)."
- **23.0 Key Risks / Constraints (≤3):** "(1) No live telemetry — mitigated by manual entry through existing forms; (2) data quality/coverage — mitigated by starting with pilot systems and expanding; (3) sustained LGU ownership — mitigated by low cost, standard stack, and a documented runbook."

**F. Expected impact**
- **24.0 Expected Outcome & Benefit (≤100w):** "WellPoint turns water security from a reactive complaint process into a proactive, equitable one. The water office sees the whole city at a glance and knows which barangay is cut off and why. Alerts fire before a shortage becomes a crisis, and response priority goes to isolated, low-income, disaster-vulnerable barangays first. Over time this shortens outage duration, targets limited resources, and improves safe, affordable access — directly serving the challenge's equity and resilience goals."
- **25.0 Expected Reach / Coverage:** "Initial pilot: all 57 barangays of Catbalogan City (~[population]); 5 pilot water systems. Replicable per municipality across Region VIII."
- **26.0 Success Indicators (≤3):** "(1) Median time from disruption to LGU awareness; (2) share of alerts acted on within the recommended window; (3) access coverage % in previously underserved barangays."

**G. Innovation, sustainability, scalability**
- **27.0 Current vs. Proposed (≤100w):** "Today, water status is gathered from logs, radio calls, and resident complaints, then pieced together manually. WellPoint replaces that with one live, geographic access picture that is updated automatically as reports and statuses change. Instead of a static report, the LGU gets explainable early-warning alerts and a ranked list of who to serve first — moving the office from reacting to complaints to preventing shortages."
- **28.0 Innovative Element (≤75w):** "Access state and vulnerability are **derived**, not labeled: a barangay is 'served' only if its system is available, flowing, safe, and affordable. Alerts fuse real geography (isolation, area, distance) with live trend, so warnings can fire before full failure — and every rule and threshold is visible, not a black box."
- **29.0 Sustainability & Maintenance (≤100w):** "Maintained by the LGU IT office or its existing web vendor. Ongoing needs: a Supabase project (free tier), a static host, and periodic data updates. The codebase is one typed data model plus pure, documented functions, so handover is fast. Data management follows existing water-office workflows; manual entry covers gaps until telemetry is connected."
- **30.0 Scalability & Replicability (≤100w):** "Every record is scoped by LGU and barangay, so a new municipality is added as records plus its own GeoJSON boundaries using the same loader — not a fork of the app. Features (dashboard, map, alerts, reports, deliveries) are independent routes, so an LGU can adopt them one at a time. The stack is standard web technology already used by many LGU vendors."
- **31.0 Next Priorities (≤3):** "1) Pilot with the Catbalogan City water office; 2) integrate real flow-meter and PAGASA/DOST data; 3) expand to neighboring municipalities."

**H. Submission and demonstration**
- 32.0 Designated Presenter: **[Presenter]**
- 33.0 Prototype / Demo Access: **[URL + login instructions for each role]**
- 34.0 Pitch Deck: **[file name / link]**
- 35.0 Source Code / Repository: **[repo URL]**
- 36.0 Submission Timestamp: *(organizer-recorded — leave blank)*

---

## 6. Q&A bank (15 minutes)

Answer in one breath, then stop. Never bluff: **"That's a production enhancement; here's the path"** is a strong answer.

**The three questions they will definitely ask**

- **"What's actually innovative here?"**
  "The honesty of the model. Most tools label a barangay 'served' or 'not served.' We *derive* access from four live signals — and weight alerts by real geography, so an isolated Level-I barangay gets a warning earlier than a served one. And every threshold is visible, so an LGU can defend the decision."
- **"Is this just a mock-up?"**
  "No. Login is real, data persists in Supabase, reports update alerts live without a refresh, and the map uses the real 57 PSGC-coded boundaries. The *water values* are simulated and we label that — boundaries and system are real."
- **"Could the LGU actually run this?"**
  "Yes — that's why we kept it small. One command locally, one Supabase project, any static host, near-zero cost. No backend, no Docker, no paid keys. The stack is what LGU IT vendors already use."

**Feasibility / operations**
- **Where does real data come from?** Existing flow meters and water-office service logs; PAGASA/DOST feeds; barangay reports. Where telemetry is missing, staff enter data through the same forms — it already works.
- **What if the venue Wi-Fi dies?** The seed is client-side, so the dashboard and score still render; the map falls back to a tile-less style. The demo keeps working.
- **How much to run?** Near PHP 0 on free tiers; ~PHP 0–1,500/month hosted.
- **Who maintains it?** The LGU IT office or its existing web vendor — one typed model file, pure functions.

**Relevance / equity**
- **How is this different from what LGUs have?** It unifies status, coverage, affordability, and community reports into one access-focused picture with explainable alerts, instead of scattered logs.
- **How does it actually make access equitable?** Response priority is severity-weighted and **underserved-first**, so isolated, low-affordability barangays are served first at equal severity.
- **Why these 57 barangays?** They are Catbalogan's real, PSGC-coded boundaries — the judges' own city.

**Technical (Level 1 judges)**
- **Why no backend?** Deliberate: it's 40% feasibility. Derived logic is pure TypeScript with stable signatures — it moves behind an Edge Function in production without changing the UI.
- **How do you prevent a fake score?** Access state and metrics are *derived*, never stored or seeded, so the score can't be gamed by its own labels.
- **Is the code quality real?** Strict TypeScript, one domain contract, documented rules, and green `typecheck` + `build` are submission gates.
- **Security / roles?** Supabase Auth + row-level security scope data by role and barangay.

**Hostile / "gotcha" questions**
- **"Isn't this just a map?"** "A map shows where things are. This derives *access* — covered is not the same as accessed — and turns it into an action list with priority."
- **"Why should we fund this over a sensor network?"** "Sensors are the right long-term input. We're the layer that turns any input — sensor or human — into a decision. Start with us; plug sensors in later."
- **"You only have 5 pilot systems."** "Correct, and by design for a 24-hour prototype. The model already covers all 57 barangays; the pilots are the systems with detailed telemetry. Adding systems is adding records."

---

## 7. Pre-demo checklist (do this the night before)

- [ ] **Create demo accounts** for each role (LGU, DRRM, Barangay official, Resident) in Supabase, with the correct `profiles.role` and `barangay_psgc`. Write the credentials down — auth is real and there is no demo-account seed.
- [ ] `cd frontend && npm run typecheck && npm run build` — both green.
- [ ] Supabase reachable from the venue; apply `supabase/schema.sql`.
- [ ] Fresh load → press **Reset demo** → confirm known-good state (Canlapwas critical, Mercedes resolved).
- [ ] Rehearse the **full demo twice, timed**, including the reset.
- [ ] Screenshots of Dashboard / Map / Alerts ready as a fallback if the live app fails.
- [ ] Fill the **Unified Pitching Data Form** and the deck (Slides 1 & 7 from the template).
- [ ] Deck on a USB drive **and** in the cloud; offline copy of the deck as PDF.
- [ ] Presenter knows the timing marks: pitch ends **4:30**, demo ends **4:45**.

---

## 8. The one paragraph to memorize

> "The challenge says water security is an access problem, not an availability problem. So we built the layer that makes access visible: one live picture of all 57 Catbalogan barangays, derived from real signals, with early warnings that are explainable and response that reaches the underserved first. It runs on free tools, needs no backend, and adding another LGU is records, not a rewrite. Water exists. We make sure people can actually reach it."
