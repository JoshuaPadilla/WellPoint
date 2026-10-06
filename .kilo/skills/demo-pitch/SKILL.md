---
name: demo-pitch
description: Use when preparing the WellPoint hackathon presentation and live demo — building the slide deck, writing the 5-minute pitch, scripting the demo, mapping the story to judging criteria, or prepping for Q&A. Trigger for Level 1 and Level 2 presentation preparation, pitch coaching, or slide content.
---

# Demo & Pitch — Score the Story

Judges score **Presentation & Demonstration at 13% in Level 2**, but a weak story also drags Relevance and Impact. Build the pitch from the judging criteria backwards.

Prerequisites: `docs/plan.md`, `docs/architecture.md`, `docs/submission.md`, a working public URL.

## Step 1 — Lead with the human problem

Open with a specific person and place, not the tech. Example: "A household in an upland barangay in Samar has a spring nearby but no water three days a week during the dry season." Then name the access gap. This is the challenge's core idea.

## Step 2 — Structure the pitch (5 minutes)

Use this timing (adjust proportionally for Level 1):

| Time | Section | Content |
| :--- | :--- | :--- |
| 0:00–0:40 | Problem | One persona, one place, the access gap |
| 0:40–1:20 | Insight | Why existing approaches fall short; your key idea |
| 1:20–3:30 | Demo | Live walkthrough of the Must features |
| 3:30–4:20 | Feasibility & scale | Data, infrastructure, cost, multi-LGU path |
| 4:20–5:00 | Impact & ask | Who benefits, measurable improvement, next step |

## Step 3 — Slide outline (6–8 slides)

1. Title — project name, team, assigned challenge
2. The problem — persona, place, access gap
3. The insight — your approach in one line
4. Solution overview — one diagram from `docs/architecture.md`
5. Live demo — what the judges are about to see
6. Impact — before/after for the persona and the LGU
7. Feasibility & scalability — data, infra, cost, multi-LGU
8. Closing — what success looks like, the ask

Rules: one idea per slide, minimal text, large readable fonts, no walls of bullet points.

## Step 4 — Script the live demo

- Rehearse the exact click-path; keep it under the demo timebox with buffer.
- State what the judge should notice before each click.
- Have the local dev server running as a backup to the public URL.
- Use deterministic seed data and start from "Reset demo".
- Trigger one live "simulate disruption" to show the alerting value in real time.
- Never type free-form during the demo; pre-fill or pre-seed everything.

## Step 5 — Map to judging criteria

Write a one-line answer for each, and make sure the deck/demo covers them:

**Level 1 (Technical):** Feasibility (40%), Relevance & Impact (25%), Technical Viability (15%), Innovation (10%), Scalability (10%).

**Level 2 (End-User):** Functionality (27%), Innovation (17%), Relevance (17%), UX (13%), Scalability (13%), Presentation (13%).

## Step 6 — Q&A preparation

Prepare short, honest answers for:

- What real data would this use, and where does it come from?
- How does it work without reliable internet/power?
- How is this different from existing LGU tools?
- What would it cost an LGU to run?
- How would it scale to other municipalities?
- What are the limitations of the prototype?

Never bluff. "That's a Level 2 enhancement; here's the path" is a strong answer.

## Step 7 — Level 1 vs Level 2

- **Level 1** (technical judges): emphasize architecture, data flow, working core logic, and feasibility. Show the code/diagram.
- **Level 2** (end-user judges): emphasize UX, real-world practicality, end-user value, and demo smoothness. Show the workflow.

## Done when

- [ ] Pitch opens with a specific persona and place
- [ ] 6–8 slide deck exists with minimal text
- [ ] Demo script rehearsed and timed with buffer
- [ ] Every judging criterion has a one-line answer
- [ ] Q&A bank written
- [ ] Backup local server ready for the live demo
