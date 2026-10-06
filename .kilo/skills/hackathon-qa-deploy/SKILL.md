---
name: hackathon-qa-deploy
description: Use to verify, harden, and ship the WellPoint prototype before submission — running lint/build, smoke-testing the demo path, adding fallback/seed data, preparing a public deployment URL, and completing the Level 1 and Level 2 submission checklists. Trigger when testing, fixing build failures, freezing features, or deploying.
---

# Hackathon QA & Deploy — Freeze, Verify, Ship

The submission is a working prototype plus a public link/repository and a slide deck. A failed build or a demo that needs a database is a failed submission. Freeze features at least 2 hours before the deadline.

## Step 1 — Static checks

Run from `frontend/` and fix everything:

```bash
npm run lint
npm run build
npm run check
```

`npm run build` must pass with no errors. `npm run check` (Prettier) should pass; if not, run `npm run format` and re-check.

## Step 2 — Smoke-test the demo path

Walk the exact click-path the presenter will use, in order, on a fresh page load. Test:

- [ ] App loads from a clean start with **no network** (use devtools offline mode) and **no database**.
- [ ] Landing view shows a clear water-security status for a named area.
- [ ] Every Must-have feature from `docs/plan.md` works end-to-end.
- [ ] Alerts, reports, and any "simulate disruption" control behave as expected.
- [ ] "Reset demo" returns to the known-good state.
- [ ] No console errors or unhandled promise rejections in the browser console.
- [ ] Test at mobile width (~375px) and desktop width.
- [ ] Test on a second browser (at least Chromium + Firefox/Safari).

## Step 3 — Harden for the live demo

- **Fallbacks**: every fetch has a bundled seed fallback. Never depend on venue Wi-Fi.
- **Determinism**: simulated data uses a fixed seed so runs look identical.
- **No dead ends**: every route resolves; no empty screens, broken links, or placeholder text.
- **Fast first paint**: avoid huge assets; compress images.
- **Presenter safety**: keep a local `npm run dev` running as a backup if the deployed URL fails.

## Step 4 — Deploy to a public URL

Submission requires an executable link/deployment. Any host that can run the TanStack Start build is acceptable. Recommended flow:

1. Ensure `npm run build` passes locally.
2. Push the repo (or connect the repo to the host).
3. Configure the host to build from `frontend/` and run the production server output.
4. Set any environment variables; for the prototype there should be few or none.
5. Verify the **public URL** loads the app and the demo path works from a phone.
6. Record the URL and repository link in `docs/submission.md`.

Do not commit secrets or API keys. If a third-party API key is required, note it in `docs/submission.md` and ensure the demo still works without it.

## Step 5 — Submission checklists

**Level 1 — due 8:00 AM Day 2**

- [ ] Working prototype at a public link/repository
- [ ] Slide deck (technical viability focus) ready
- [ ] Feature freeze respected
- [ ] `npm run build` green at the frozen commit
- [ ] `docs/submission.md` has link, repo, and team details

**Level 2 — due 8:00 AM Day 3 (Top 4)**

- [ ] Refinements from Level 1 feedback applied and re-verified
- [ ] Updated **5-minute** deck
- [ ] Demo rehearsed end-to-end at least twice, timed
- [ ] Public URL re-verified after any change

## Step 6 — Output

Maintain `docs/submission.md` with: public URL, repository, build/run command, team members, assigned challenge, data sources/attribution (required for open-source and public APIs), and known limitations.

## Done when

- [ ] lint, build, and check all pass
- [ ] Full demo path smoke-tested offline and on mobile
- [ ] Public URL verified after the freeze
- [ ] `docs/submission.md` complete with attribution
