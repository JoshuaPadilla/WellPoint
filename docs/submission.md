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
cd frontend
npm install
npm run dev       # http://localhost:3000
npm run build     # static production build in frontend/dist
npm run preview   # serve the production build
npm run lint      # ESLint
npm run check     # Prettier check
```

Deployment: the build is a static bundle. Host `frontend/dist` on any static host (Netlify / Vercel / Cloudflare Pages / GitHub Pages) or serve it from an LGU laptop. No server, database, or API keys are required.

## Data sources & attribution

- **Runtime data:** none external. All water data is simulated, deterministic seed data bundled with the app (`frontend/src/data/seed.ts`), generated for demonstration only.
- **Location names:** barangay and municipality names of Catbalogan City, Samar (Region VIII) are used for local context. Coordinates are illustrative and not survey-grade.
- **Open-source dependencies** (all permissive licenses):
  - React 19 — MIT
  - TanStack Router — MIT
  - Vite — MIT
  - Tailwind CSS v4 — MIT
  - TypeScript — Apache-2.0
  - ESLint / Prettier — MIT
- No third-party API is called at runtime.

## Known limitations

- Telemetry and water data are simulated; there is no live sensor or PAGASA/DOST integration in the prototype.
- Authentication, persistent storage, and a backend are out of scope for the prototype (documented production path in `docs/architecture.md` §7).
- Coordinates are illustrative.
- Community reports persist for the browser session only.

## Level 1 checklist (due 8:00 AM Day 2)

- [ ] Working prototype at the public URL / repository
- [ ] Slide deck (technical viability focus) ready
- [ ] Feature freeze respected
- [ ] `npm run build` green at the frozen commit
- [ ] This file has URL, repo, and team details

## Level 2 checklist (due 8:00 AM Day 3, Top 4)

- [ ] Refinements from Level 1 feedback applied and re-verified
- [ ] Updated 5-minute deck
- [ ] Demo rehearsed end-to-end at least twice, timed
- [ ] Public URL re-verified after any change
