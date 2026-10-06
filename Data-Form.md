# 2026 HACKATHON – UNIFIED PITCHING DATA FORM

**Project:** WellPoint — Water Security access & early-warning platform
**Event:** rSCENE 2026 Hackathon, Catbalogan City, Samar
**Assigned challenge:** Challenge 5 — Water Security

> Team-specific fields are left as `[placeholders]` to be completed before submission.

---

## A. Team and Challenge Identification

**1. Team ID**
_Organizer-assigned / short text_
> Do not fill this up.

**2. Team Name**
_Short text_
> [Team Name]

**3. LGU Represented**
_Short text_
> [City / Municipality]

**4. Team Members**
_Names; one per line_
> [Member 1]
> [Member 2]
> [Member 3]

**5. Assigned Challenge Area**
_Select one_
> Water Security (Challenge 5)

---

## B. Problem and User Understanding

**6. Problem Context and Current Situation**
_Maximum 100 words_
> Catbalogan City, Samar has 57 barangays across coastal, urban, and upland terrain. Some sit beside a spring, river, or reservoir yet still cannot reliably access safe, affordable water, especially in geographically isolated and underserved barangays. The City Water/Engineering Office tracks service through scattered logs, radio calls, and resident complaints, so it has no single live picture of which systems are producing, which communities are cut off, and where quality is failing. When a typhoon, drought, or contamination event disrupts service, outages are discovered late. The core issue is equitable access, not water availability.

**7. Primary User and Beneficiaries**
_Maximum 50 words_
> Primary user: the City Water/Engineering Office staff who monitor service and prioritize response. Beneficiaries: barangay officials who report and receive status, DRRM officers planning emergency water distribution, and households in all 57 barangays, especially isolated, underserved, and low-income communities.

**8. Key User Need / Pain Point**
_Maximum 50 words_
> The water office lacks one live, trustworthy view of which barangays can actually access safe, affordable water. Status is fragmented across logs, calls, and complaints, so staff learn about shortages and contamination too late and cannot fairly prioritize the most vulnerable communities.

**9. Basis / Evidence of the Problem**
_Maximum 3 items_
> 1. Assigned challenge (Water Security): "water security extends beyond mere proximity to a water source" — a community can have a source and still be water-insecure.
> 2. Challenge situation: geographic disparities across Region VIII cause intermittent supply, seasonal shortages, and disaster vulnerability in isolated or underserved areas.
> 3. Observed basis: LGU water status is split across service logs, radio reports, and complaints with no shared live view (assigned-challenge scenario).

---

## C. Proposed Solution

**10. Solution Name**
_Short text_
> WellPoint

**11. Solution Summary**
_Maximum 75 words_
> WellPoint is a web-based water-security access and early-warning platform for LGU water offices and barangays. It turns four per-barangay signals — service reach, live reliability and safety, affordability, and resident reports — plus vulnerability computed from real geography into one live view: a coverage map of all 57 Catbalogan barangays, explainable alerts, and a community reporting loop.

**12. Solution Type**
_Select one_
> Dashboard

**13. Core Functions**
_Maximum 5 functions_
> 1. Water-security dashboard: status banner plus KPI cards (coverage, reliability, active alerts, affordability).
> 2. Coverage and status map of all 57 real barangay boundaries, colored by derived access state, with source markers and service levels.
> 3. Explainable alerts and early warning with severity, cause, recommended action, and vulnerability-weighted response priority.
> 4. Community report submission that persists to Supabase and updates alerts live.
> 5. Demo controls: simulate typhoon/drought/contamination/maintenance and reset to a known-good state.

---

## D. Prototype, Technical Functionality, and User Experience

**14. Prototype Status**
_Select one + maximum 50 words_
> **Working Prototype** — all core functions work: dashboard, 57-barangay map, derived alerts, report submission with live Supabase sync, and disruption simulation/reset. Water data is deterministic simulated data; barangay boundaries are real. `npm run typecheck` and `build` pass.

**15. User and System Workflow**
_Maximum 5 major steps_
> 1. User opens WellPoint and signs in; the Supabase `profiles` role sets the view (LGU, official, citizen, DRRM).
> 2. The client loads the 57-barangay GeoJSON and the deterministic seed, and syncs sources, reports, and warnings from Supabase.
> 3. Derived logic computes access state, vulnerability, alerts, and water-security metrics from the current signals.
> 4. The user reads the dashboard, map, and alerts; a barangay official or resident submits a report.
> 5. The report persists to Supabase, Realtime re-derives alerts live, and staff acknowledge, resolve, or act on the recommended action.

**16. Technology and Data Used**
_Structured list_
> - **Languages:** TypeScript (strict), HTML/CSS, SQL.
> - **Frontend:** React 19 + TanStack Router (Vite 8) SPA; shadcn/ui + Tailwind CSS v4; MapLibre GL for maps.
> - **Backend/data:** Supabase (PostgreSQL + Auth + Realtime) via `@supabase/supabase-js`; no separate server.
> - **Logic:** pure TypeScript modules — `data/types.ts` and `lib/{seed,alerts,metrics,vulnerability}.ts`.
> - **Data:** deterministic client seed (`baseSeed 20261006`) — 57 real PSGC-coded barangay boundaries (GeoJSON), 5 pilot systems, water sources, and 6-tick service status; water/telemetry values are simulated.
> - **Optional API:** Open-Meteo (supply outlook; degrades gracefully).
> - **Quality/deploy:** ESLint, Prettier, `tsc --noEmit`; static host + Supabase.

**17. Technical Dependencies and Current Limitations**
_Maximum 5 items_
> 1. Needs a reachable Supabase project (Postgres + Auth + Realtime) and its anon key; there is no separate backend.
> 2. Internet is needed for Supabase, Carto map tiles, and optional Open-Meteo; the map degrades to a tile-less blank style offline and the client seed still renders.
> 3. Water-service and telemetry data are simulated; there is no live sensor, PAGASA, or DOST integration in the prototype.
> 4. Authentication is real, but role management has no UI — roles and barangays are set in the Supabase `profiles` table.
> 5. Access state and vulnerability are derived from a documented model on simulated inputs — demonstration-grade, not a certified assessment.

**18. User Experience and Accessibility**
_Maximum 75 words_
> Designed for a 5-second answer: a status banner, labeled KPI cards, and plain-language alerts that state the cause and the recommended action. Navigation is a simple mobile-first layout with large tap targets (44px+). Status uses icon and text, never color alone, with WCAG AA contrast. The 57-barangay map reads at a glance, and loading, error, and offline states are explicit.

**19. User Testing / Feedback**
_Maximum 75 words / optional_
> Not yet conducted. Internal team walkthroughs verified the full demo path (dashboard → map → alerts → report → simulate → reset), and Reset demo restores a known-good state.

---

## E. Implementation and Feasibility

**20. Proposed Operational Use and Implementing Office**
_Maximum 100 words_
> WellPoint would run in the City Water/Engineering Office, with the MDRRMO and barangay offices as partners. Staff use it daily to monitor all 57 barangays and, during disasters, to prioritize response: they read the dashboard and map, triage community reports, and act on alerts. Barangay officials submit reports and residents check status. The implementing office owns the Supabase project and accounts. In production it ingests existing flow-meter and PAGASA/DOST data; where telemetry is absent, staff enter data through the same forms.

**21. Deployment Requirements**
_Maximum 6 items_
> 1. **Hosting:** a static web host (Vercel/Netlify/VPS) plus a Supabase project (Postgres, Auth, Realtime).
> 2. **Data:** barangay GeoJSON boundaries per LGU; water-system, source, and service records; staff-entered or metered telemetry.
> 3. **Connectivity:** internet for Supabase and map tiles; the offline fallback still works.
> 4. **Personnel:** trained LGU staff to operate and triage; a developer/vendor for maintenance.
> 5. **Institutional support:** LGU adoption and data-sharing with MDRRMO and the water utility.
> 6. **Accounts and training:** Supabase accounts per role plus a short orientation.

**22. Indicative Cost and Deployment Time**
_Cost range + estimated time_
> PHP 0 locally (Supabase free tier + free static host); roughly PHP 0–1,500 per month if hosted, plus optional developer maintenance. No paid APIs. Initial pilot deployment: about 2–4 weeks (data preparation, accounts and training, and rollout to one LGU).

**23. Key Implementation Risks / Constraints**
_Maximum 3 items_
> 1. **Data availability and quality** — water data may be incomplete; mitigate with manual entry through the same forms and phased digitization.
> 2. **Field connectivity** — limited internet; mitigate with the client-side seed, tile-less map fallback, and low-bandwidth mobile-first design.
> 3. **Adoption and maintenance capacity** — thin LGU technical staff; mitigate with a standard web stack, documentation/runbook, and vendor support.

---

## F. Expected Impact

**24. Expected Outcome and LGU/Community Benefit**
_Maximum 100 words_
> WellPoint gives the LGU one live, explainable picture of who can actually access water, replacing scattered logs and late complaints. Staff detect shortages, contamination, and outages earlier and respond with severity- and vulnerability-weighted priority that serves isolated, low-income barangays first. Residents and barangay officials gain a simple status answer and a real reporting channel, closing the feedback loop. The result is faster, fairer service delivery, better-targeted resources, and stronger community water security under typhoon, drought, and contamination stress.

**25. Expected Reach / Coverage**
_Short quantitative/text answer_
> All 57 barangays of Catbalogan City and their households; the pilot covers 5 water systems. Direct users: the City Water/Engineering Office, 57 barangay councils, and the MDRRMO. Replicable to any Region VIII LGU by loading its own barangay boundaries and records.

**26. Success Indicators**
_Maximum 3 indicators_
> 1. **Access coverage:** share of population with derived full/partial access (baseline → increase).
> 2. **Alert response time:** median time from alert raised to acknowledgement or action (reduce).
> 3. **Population-weighted service reliability** (flow %) — increase; critical alerts resolved.

---

## G. Innovation, Sustainability, and Scalability

**27. Current Approach vs. Proposed Improvement**
_Maximum 100 words_
> Today the water office tracks service through paper or electronic logs, radio and text reports, and resident complaints, so status is fragmented and outages surface late. WellPoint replaces that with one live read model: four queryable signals per barangay, access state and vulnerability derived from real geography and current conditions, and alerts that name the cause and a recommended action. Response priority is severity- and vulnerability-weighted so underserved barangays are served first — a shift from reactive complaint handling to proactive, equitable early warning.

**28. Innovative Element**
_Maximum 75 words_
> Structural vulnerability is computed from each barangay's real polygon geometry (area and distance from the city center), then combined with live service trend and affordability. This makes early warning forward-looking and explainable — an alert can fire before a failure fully hits — instead of a black-box score. Covered is not treated as accessed: access state is derived from live signals, so a barangay with a system can still be flagged insecure.

**29. Sustainability and Maintenance**
_Maximum 100 words_
> The City Water/Engineering Office would own and operate WellPoint, with MDRRMO and barangay offices as partners; a developer or vendor maintains the code. Ongoing needs: a Supabase project (free tier is enough for a pilot), a static host, periodic updates, role and account management in the `profiles` table, and keeping barangay and water data current. Data management is lightweight because records are scoped by LGU and barangay. Funding is minimal (near-zero hosting) and the standard web stack keeps maintenance low and portable.

**30. Scalability and Replicability**
_Maximum 100 words_
> Every record is scoped by LGU and barangay, so onboarding a new LGU means adding its barangay GeoJSON and data records, not forking the app. The dashboard, coverage map, alerts, and reports are independent modules adoptable one at a time. The map falls back to a tile-less style offline, and the SPA is mobile-first for low-bandwidth areas. The documented production path moves the same pure derived functions and types behind Supabase Edge Functions for live telemetry and multi-LGU tenancy, with the UI unchanged.

**31. Next Development Priorities**
_Maximum 3 priorities_
> 1. Integrate real data: existing flow meters plus PAGASA/DOST feeds, with staff manual entry as fallback.
> 2. Add role-management UI and multi-LGU tenancy/scoping in Supabase.
> 3. Pilot with the Catbalogan City water office, then add SMS/email alerts and validated accessibility testing.

---

## H. Submission and Demonstration Information

**32. Designated Presenter**
_Name_
> [Presenter Name]

**33. Prototype / Demo Access**
_URL / access details_
> [Deployment URL] — login: [email] / [password]

**34. Pitch Deck**
_File name / URL_
> [Deck file name / URL]

**35. Source Code / Repository**
_URL / file location_
> [Repository URL]

**36. Submission Timestamp**
_Organizer-recorded_
> Do not fill this up.

---

### Reference lists

**Solution Types:** Web Application · Mobile Application · Dashboard · Data Platform · Decision-Support System · Mapping Tool · Monitoring System · Website · Other Software-Based Solution

**Prototype Status:** Proof of Concept · Partially Functional Prototype · Working Prototype
