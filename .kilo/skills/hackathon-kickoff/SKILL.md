---
name: hackathon-kickoff
description: Use at the START of the rSCENE 2026 hackathon (or when the team asks "where do we start?") to decode the assigned water challenge, map it to the official judging criteria, lock a feasible MVP scope, and produce a 24-hour milestone plan. Trigger when the team just drew a challenge, needs to plan/scope the prototype, define personas, or write user stories.
---

# Hackathon Kickoff — Frame, Scope, Timebox

Use this skill before writing any feature code. The goal is a one-page plan that a judge would recognize as a real solution to the assigned water problem.

Read these first (they are the source of truth):

- `docs/hackathon_guidelines.md` — rules, schedule, judging criteria, deliverables
- `docs/draw_challenge.md` — the assigned problem area

## Non-negotiable constraints

- Software only. No hardware. Simulated data or pre-existing sensor telemetry is allowed.
- All code must be original and written during the event. Open-source libraries/APIs are allowed **with attribution**.
- Teams are 3 members; collaboration is limited to registered members.
- Level 1 prototype + slide deck due **8:00 AM Day 2**. Level 2 refined prototype + 5-minute deck due **8:00 AM Day 3**.

## Step 1 — Confirm the assigned problem area

The 5 possible areas are: Watershed Preservation & Management, Water Economics, Water-Related Infrastructure, Circular Economy in Water Resources, Water Security. The current assignment is **Water Security** (see `docs/draw_challenge.md`). Confirm this is correct before proceeding.

## Step 2 — Write the problem statement

Fill this in and save to `docs/plan.md`:

```markdown
## Problem
<Who> in <where> cannot <access/afford/trust> water because <root cause>, especially when <disruption>.

## Evidence / context
- <facts pulled from docs/draw_challenge.md and hackathon_guidelines.md>

## Why now
<why this matters for LGUs and communities in Region VIII>
```

Focus on the **access gap**, not just water availability. The challenge explicitly says a community can have a source and still be water-insecure.

## Step 3 — Define personas and stakeholders

Pick 2–4 and list their goals and pain points. Typical LGU water-security users:

- **LGU water/engineering office staff** — monitor coverage, disruptions, complaints, response.
- **Barangay officials / community leaders** — report outages, contamination, request help.
- **Households** — need to know when/where water is available, safe, and affordable.
- **Water utility operators** — maintain systems, prioritize repairs, manage supply.
- **Disaster/DRRM officers** — early warning and emergency water distribution.

Save to `docs/plan.md` under `## Personas`.

## Step 4 — Align to the judging criteria

Map every planned feature to the scoring weights. If a feature does not score, cut it.

**Level 1 (Technical Judges)** — Feasibility & Implementability **40%**, Problem Relevance & Impact **25%**, Technical Viability **15%**, Innovation **10%**, Sustainability & Scalability **10%**.

**Level 2 (End-User Judges)** — Technical Functionality **27%**, Innovation **17%**, Relevance **17%**, UX & Design **13%**, Scalability & Sustainability **13%**, Presentation & Demo **13%**.

Record the mapping in `docs/plan.md` under `## Judging alignment`.

## Step 5 — Lock the MVP scope

Write a must / should / won't list. Bias hard toward **feasibility** (40%): a smaller, fully working demo beats a broad, broken one.

```markdown
### Must (demo cannot ship without)
- ...
### Should (only if Must is done and verified)
- ...
### Won't (explicitly out of scope)
- ...
```

Rule of thumb: the Must list must be demoable end-to-end with simulated data and no manual database setup.

## Step 6 — Build the 24-hour milestone plan

Save to `docs/plan.md` under `## Timeline`. Anchor to the real deadlines:

| Time | Milestone | Owner |
| :--- | :--- | :--- |
| T+0–2h | Plan + architecture locked | all |
| T+2–10h | Core feature working with fake data | |
| T+10–18h | Secondary features + UX pass | |
| T+18–22h | QA, fallback data, freeze | |
| T+22–24h | Deck + demo rehearsal, submit by 8:00 AM | |

Assign one owner per milestone. Add a hard **feature freeze** 2 hours before the submission deadline.

## Step 7 — Outputs

Produce and keep updated:

- `docs/plan.md` — problem, personas, judging alignment, scope, timeline
- `docs/pitch-outline.md` — first cut of the story (refined later with the `demo-pitch` skill)

## Done when

- [ ] Assigned problem area confirmed
- [ ] Problem statement names a specific user, place, and root cause
- [ ] 2–4 personas with goals and pain points
- [ ] Every Must-have feature maps to a judging criterion
- [ ] MVP must/should/won't list is written
- [ ] 24-hour timeline with owners and a feature-freeze time exists
