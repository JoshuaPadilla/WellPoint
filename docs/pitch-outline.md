# WellPoint — Pitch & Demo Outline

Built backwards from the judging criteria (`docs/hackathon_guidelines.md` §VII). Prerequisites: `docs/plan.md`, `docs/architecture.md`, a working build.

**The one-liner:** *WellPoint makes the water-access gap visible — so LGUs can act before a shortage becomes a crisis.*

---

## 1. 5-minute pitch structure

| Time | Section | Content |
| :--- | :--- | :--- |
| 0:00–0:40 | **Problem** | One household in an upland Catbalogan barangay has a spring nearby but no water three days a week in the dry season. The gap is access, not availability. |
| 0:40–1:20 | **Insight** | LGU water offices don't lack data — they lack one live picture. Status lives in logs, radio calls, and complaints, so outages are discovered too late. |
| 1:20–3:30 | **Demo** | Live walkthrough: dashboard → coverage map → alerts → submit a report → simulate a typhoon → watch the banner and alerts react. |
| 3:30–4:20 | **Feasibility & scale** | Runs offline on any laptop or static host, PHP 0; new LGUs are records, not forks; production path reuses the same contracts. |
| 4:20–5:00 | **Impact & ask** | Faster, fairer response for underserved barangays; ask: a pilot with the Catbalogan City water office. |

---

## 2. Slide outline (8 slides, one idea each, large text)

1. **Title** — WellPoint · team · Challenge 5: Water Security.
2. **The problem** — persona, place, the access gap.
3. **The insight** — one live picture of who can actually access water.
4. **Solution overview** — the §2 diagram from `docs/architecture.md`.
5. **Live demo** — what the judges are about to see (3 bullets max).
6. **Impact** — before/after for the barangay and the LGU office.
7. **Feasibility & scalability** — offline, PHP 0, multi-LGU, production path.
8. **Closing** — what success looks like; the ask.

Rules: no walls of bullets, no tiny fonts, one diagram, plain language.

---

## 3. Live demo script (click-path)

Start from a clean load and press **Reset demo**.

1. **Dashboard** — "Notice the banner: Catbalogan is at *Watch*. Four KPIs explain why: coverage, reliability, active alerts, affordability." *(Pause so judges read the score's breakdown.)*
2. **Coverage** — "Green is served, amber is partial, red is underserved. Canlapwas is critical; Poblacion is secure. The same city, very different access."
3. **Alerts** — "Each alert states the cause and the recommended action in plain language. This is our early-warning rule set — not a black box."
4. **Reports** — submit a contamination report for Bangon. "A barangay official can report in under 20 seconds. It immediately appears as an alert."
5. **Simulate a typhoon** on San Andres — "Watch the reliability score drop and a new critical alert appear without a refresh."
6. **Reset demo** — "Every run is deterministic, so the demo is repeatable."

Timing: keep it under 3 minutes with buffer. Never type free-form — pre-fill the report fields.

---

## 4. Judging criteria — one-line answers

**Level 1 (Technical):**
- Feasibility (40%): one static app, no server, no DB, no hardware, no network — deployable anywhere.
- Relevance & Impact (25%): models the exact access gap named in the challenge.
- Technical Viability (15%): typed contracts, pure deterministic simulation, documented derived rules, green build.
- Innovation (10%): fuses status, sources, coverage, affordability, and reports into one explainable early-warning score.
- Scalability (10%): records-scoped multi-LGU data; independent feature routes.

**Level 2 (End-User):**
- Functionality (27%): deterministic demo with reset; no dead ends.
- Innovation (17%): predictive warnings, transparent thresholds.
- Relevance (17%): local barangays, plain-language actions.
- UX (13%): 5-second status answer, mobile-first, labeled status colors.
- Scalability (13%): documented production path and runbook.
- Presentation (13%): scripted, timed, with a local fallback server.

---

## 5. Q&A bank

- **What real data would this use?** LGU water-office service logs and existing flow meters, plus PAGASA/DOST hazard feeds; where telemetry is missing, staff enter data manually in the same forms.
- **How does it work without internet/power?** It ships its data and runs entirely in the browser; the whole app is a static bundle that works offline on a laptop or phone.
- **How is it different from existing LGU tools?** It unifies status, coverage, affordability, and community reports into one access-focused score with explainable alerts — instead of scattered logs.
- **What would it cost to run?** PHP 0 on static hosting or an existing LGU laptop; optional small server + DB only if live telemetry is adopted.
- **How does it scale to other municipalities?** Data is scoped by LGU/barangay, so a new LGU is a set of records, not a new codebase.
- **Prototype limitations?** No real auth, no persistence beyond the session, illustrative coordinates, and simulated telemetry — all noted as Level 2/production enhancements.

Never bluff: "That's a production enhancement; here's the path" is a strong answer.
