# WellPoint — Submission Record

Maintained per the `hackathon-qa-deploy` skill. Fill in the bracketed values before submitting.

## Submission details

| Field | Value |
| :--- | :--- |
| Project | WellPoint — Water Security access & early-warning platform |
| Assigned challenge | Challenge 5 — Water Security |
| Event | rSCENE 2026 Hackathon, Catbalogan City, Samar |
| Team | [team name] |
| Members | [member 1] · [member 2] · [member 3] |
| Representing LGU | [city / municipality] |
| Public URL | [deployment URL] |
| Repository | [repository URL] |

## Build & run

```bash
docker compose up          # Postgres + API + UI (recommended for the demo)
# or individually:
cd backend && npm install && npm run start:dev     # NestJS API (reads DB)
cd frontend && npm install && npm run dev          # SPA at http://localhost:3000
```

The DB is seeded deterministically on API boot (57 barangay boundaries + water demo data). Verify both apps lint and build green: `cd backend && npm run lint && npm run build`, `cd frontend && npm run lint && npm run build`.

Deployment: the Docker Compose topology is also the production shape — run the API (serving the built SPA) and Postgres on a single VPS or LGU server behind one origin. No paid services or API keys are required.

## Data sources & attribution

- **Runtime data:** none external. Water data is simulated, deterministic seed data imported into Postgres by the seeder (`backend/src/db/seed/`), generated for demonstration only.
- **Administrative boundaries:** `seed-data/catbalogan-brgys.geojson` — the real barangay polygons of all 57 barangays of Catbalogan City, Samar (Region VIII), PSGC-coded (`ADM*_PCODE`, `psgc_code`), with `AREA_SQKM`, from publicly available Philippine administrative-boundary data (dataset dated 2022-11-09, valid 2023-11-06). *Confirm the exact upstream source for final attribution.*
- **Location names:** barangay and municipality names of Catbalogan City, Samar (Region VIII) are used for local context. Barangay boundaries are real; water-source coordinates and all water/service attributes are simulated and illustrative.
- **Open-source dependencies** (all permissive licenses):
  - React 19 — MIT
  - TanStack Router — MIT
  - TanStack Query — MIT
  - Vite — MIT
  - Tailwind CSS v4 — MIT
  - shadcn/ui + Radix UI — MIT
  - NestJS 11 — MIT
  - TypeORM — MIT
  - PostgreSQL — PostgreSQL License
  - Zod — MIT
  - TypeScript — Apache-2.0
  - ESLint / Prettier — MIT
- No third-party API is called at runtime.

## Known limitations

- Telemetry and water data are simulated; there is no live sensor or PAGASA/DOST integration in the prototype.
- No authentication / single-tenant (documented production path in `docs/architecture.md` §7).
- Barangay boundaries are real (public PSGC-coded data); water-source points and all water/service inputs are illustrative, not survey-grade.
- Access state and vulnerability tier are derived from a documented model on simulated inputs — demonstration-grade, not a certified assessment.
- Community reports and demo state persist in Postgres (single shared instance; `Reset demo` re-seeds to a known-good state).

## Level 1 checklist (due 8:00 AM Day 2)

- [ ] Working prototype at the public URL / repository
- [ ] Slide deck (technical viability focus) ready
- [ ] Feature freeze respected
- [ ] `npm run build` green in `frontend/` **and** `backend/` at the frozen commit
- [ ] `docker compose up` → fresh deterministic state, demo walkable
- [ ] This file has URL, repo, and team details

## Level 2 checklist (due 8:00 AM Day 3, Top 4)

- [ ] Refinements from Level 1 feedback applied and re-verified
- [ ] Updated 5-minute deck
- [ ] Demo rehearsed end-to-end at least twice, timed
- [ ] Public URL re-verified after any change
