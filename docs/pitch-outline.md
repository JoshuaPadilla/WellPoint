# WellPoint — Pitch & Demo Outline

Built backwards from the judging criteria (`docs/hackathon_guidelines.md` §VII). Prerequisites: `docs/plan.md`, `docs/architecture.md`, a working build.

**The one-liner:** *WellPoint makes the water-access gap visible — so LGUs can act before a shortage becomes a crisis.*

---

## 1. 5-minute pitch structure

| Time | Section | Content |
| :--- | :--- | :--- |
| 0:00–0:40 | **Problem** | One household in an upland Catbalogan barangay has a spring nearby but no water three days a week in the dry season. The gap is access, not availability. |
| 0:40–1:20 | **Insight** | LGU water offices don't lack data — they lack one live picture. Status lives in logs, radio calls, and complaints, so outages are discovered too late. |
| 1:20–3:30 | **Demo** | Live walkthrough: dashboard → coverage map of all 57 real barangay boundaries → alerts → submit a report → simulate a typhoon → watch the banner and alerts react. |
| 3:30–4:20 | **Feasibility & scale** | One-command start (Docker Compose: Postgres + API + UI), deterministic seed, real 57-barangay map; new LGUs are records + their own GeoJSON, not forks. |
| 4:20–5:00 | **Impact & ask** | Faster, fairer response for underserved barangays; ask: a pilot with the Catbalogan City water office. |

---

## 2. Slide outline (8 slides, one idea each, large text)

1. **Title** — WellPoint · team · Challenge 5: Water Security.
2. **The problem** — persona, place, the access gap.
3. **The insight** — one live picture of who can actually access water.
4. **Solution overview** — the §2 diagram from `docs/architecture.md`.
5. **Live demo** — what the judges are about to see (3 bullets max).
6. **Impact** — before/after for the barangay and the LGU office.
7. **Feasibility & scalability** — one-command full-stack run, real barangay boundaries, multi-LGU, production path.
8. **Closing** — what success looks like; the ask.

Rules: no walls of bullets, no tiny fonts, one diagram, plain language.

---

## 3. Live demo script (click-path)

Start from a clean load and press **Reset demo**.

1. **Dashboard** — "Notice the banner: Catbalogan is at *Watch*. Four KPIs explain why: coverage, reliability, active alerts, affordability." *(Pause so judges read the score's breakdown.)*
2. **Coverage** — "Green is served, amber is partial, red is underserved — and this access state is *derived* from each system's live status, not labeled. Every one of the 57 barangay boundaries is real, and each one also carries a vulnerability tier computed from its geography. Canlapwas is critical; Poblacion 1 is secure. The same city, very different access."
3. **Alerts** — "Each alert states the cause and the recommended action in plain language. This is our early-warning rule set — not a black box."
4. **Reports** — submit a contamination report for Bangon. "A barangay official can report in under 20 seconds. It immediately appears as an alert."
5. **Simulate a typhoon** on San Andres — "Watch the reliability score drop and a new critical alert appear without a refresh."
6. **Reset demo** — "Every run is deterministic, so the demo is repeatable."

Timing: keep it under 3 minutes with buffer. Never type free-form — pre-fill the report fields.

---

## 4. Judging criteria — one-line answers

**Level 1 (Technical):**
- Feasibility (40%): full-stack but one-command local run (Docker Compose), deterministic seed, no external services/keys — deployable to a VPS or LGU server.
- Relevance & Impact (25%): models the exact access gap named in the challenge.
- Technical Viability (15%): TypeORM entities, Zod-validated API, server-side derived rules, green builds in both apps.
- Innovation (10%): fuses status, sources, coverage, affordability, and reports into one explainable early-warning score.
- Scalability (10%): records-scoped multi-LGU data; independent modules/routes.

**Level 2 (End-User):**
- Functionality (27%): deterministic demo with reset; real persistence; no dead ends.
- Innovation (17%): early warning driven by real geography + trend — structural vulnerability makes alerts fire before full failure; transparent thresholds.
- Relevance (17%): local barangays, plain-language actions.
- UX (13%): 5-second status answer, mobile-first, labeled status colors.
- Scalability (13%): documented production path and runbook.
- Presentation (13%): scripted, timed, with a Docker Compose fallback.

---

## 5. Q&A bank

- **What real data would this use?** LGU water-office service logs and existing flow meters, plus PAGASA/DOST hazard feeds; where telemetry is missing, staff enter data manually through the same API forms.
- **How is it run at the venue?** One command — `docker compose up` — starts Postgres, the NestJS API, and the UI with a deterministic seed, so the demo needs no external network beyond pulling the images once.
- **How does it actually address equitable access?** Four signals per barangay — service reach, current reliability/safety, affordability, resident reports — plus vulnerability computed from real geography. Access state is derived from those signals (not pre-labeled), and response priority is underserved-first, so the tool surfaces *who* is cut off and *which* barangay must be served first.
- **How is it different from existing LGU tools?** It unifies status, coverage, affordability, and community reports into one access-focused score with explainable alerts — instead of scattered logs.
- **What would it cost to run?** Near PHP 0 locally (Docker/Postgres are free); ~PHP 500–1,500/month for a small VPS if hosted. No paid APIs.
- **How does it scale to other municipalities?** Data is scoped by LGU/barangay, so a new LGU is a set of records plus its own GeoJSON boundaries, not a new codebase.
- **Prototype limitations?** No auth (single-tenant), simulated water/telemetry data, and real barangay boundaries with illustrative water-source points and service attributes — all noted as Level 2/production enhancements.

Never bluff: "That's a production enhancement; here's the path" is a strong answer.
