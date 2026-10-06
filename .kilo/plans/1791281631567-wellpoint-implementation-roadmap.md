# WellPoint — Implementation Roadmap

From current scaffold → fully realized water-security platform, sequenced by dependency and traced to the four personas. Deep detail lives in `docs/`; this plan is the ordered execution path.

## 1. Goal & scope

Build the working WellPoint prototype (`docs/plan.md` §4 Must + Should), **with real Google OIDC sign-in, JWT sessions, and RBAC** gating the four persona views. Ship for Level 1 (Day 2, 8:00 AM) and harden for Level 2 (Day 3, 8:00 AM). The documented production path (telemetry ingestion, multi-LGU tenancy, barangay-admin invitation/email delivery) is the final stretch, built only if Must+auth+Should are green.

**Resolved decisions (from user):**
1. **Auth is real now**: Google OAuth + JWT + RBAC, not a no-login role-mode switcher.
2. **Google-only sign-in** for all four personas; roles pre-seeded by verified email (no password path).

## 2. Current baseline (verified against code)

| Area | State |
| :--- | :--- |
| `docs/` | Complete target architecture, personas, judging, submission, auth design. |
| `seed-data/catbalogan-brgys.geojson` | **57 real Catbalogan barangay polygons** present (PSGC-coded, `AREA_SQKM`). |
| `compose.yaml` | Postgres 16 + API (dev) + web (Vite dev); frontend `nginx.conf` + runtime Dockerfile for prod. Coherent. |
| Backend domain | **Absent.** No `WaterSource`/`WaterSystem`/`ServiceStatus`/`Community`/`CommunityReport`/`Alert` entities, no seeder, no metrics/alerts/vulnerability services, no `/reports` or `/demo` endpoints. |
| Backend auth | Partial Google OAuth scaffold: `GoogleStrategy` + `GoogleOAuthGuard` + `auth.controller` (callback stubbed), `JwtStrategy` (reads Bearer **or** `access_token` cookie), `User` entity, `UsersService.findOrCreateFromGoogle`. `AuthService.generateTokens` is commented out; no token issuance, no RBAC files. Stray `console.log(payload)` in `jwt.strategy.ts`. |
| Frontend | Bare TanStack Router scaffold (`index` + `__root` only). TanStack Query in `package.json` but no provider/hooks; no `zod`, no API client, no shared types, no components. |
| Stale artifacts | `backend/dist/water.module.js` and `frontend/dist/` (coverage/alerts/reports chunks) from prior work no longer in `src`. |
| Secrets | `backend/.env` contains real Google OAuth client id/secret + JWT secrets (committed). |

**Contradictions to resolve in code:** `permission_guide.md` describes RBAC files (`permissions.ts`, `role_permissions.ts`, `permission.guard.ts`) that do not exist, with a loan-domain role set (`admin/manager/staff/viewer/pending`) that conflicts with the four water personas. `typeorm@^1.1.1` in `backend/package.json` is anomalous — verify it installs/builds or pin a real version.

## 3. Target architecture (reference, not restated)

- Entities + derived logic: `docs/architecture.md` §4–5.
- API contract: `docs/architecture.md` §6.
- Persona matrix + data flows + state machines: `docs/system-design.md` Part 1 & 2.
- Auth/identity/invitation design: `docs/auth-and-permissions.md`.
- Judging alignment & MVP scope: `docs/plan.md` §3–4.

## 4. RBAC model (the reconciliation)

Two-layer enforcement, per `auth-and-permissions.md` §"Authorization and data scoping":

- **Layer 1 — role → permission tokens** (flat `resource:action`, any-match guard). Replaces the stale loan tokens in `permission_guide.md`.
- **Layer 2 — scope filter** (which rows) derived from `Membership` (LGU + optional barangay), never from client input. `:own` tokens always pair with the actor's `membership.barangayId` (PSGC).

**Roles (`UserRoles` enum)** — the four personas plus one admin role for the production path:

| Role | Scope |
| :--- | :--- |
| `water-officer` | city-wide |
| `drrm-officer` | city-wide |
| `barangay-official` | one barangay |
| `resident` | one barangay, read-only public status |
| `barangay-admin` | one barangay (invitation; production-path stretch) |

**Permission tokens (`Permission` union):**

```ts
export const PERMISSIONS = [
  'dashboard:read',          // KPI/metrics read-model
  'barangay:read',           // city-wide communities + access state
  'vulnerability:read',      // city-wide tiers
  'alert:read',              // city-wide alerts
  'source:read',             // city-wide source health
  'report:read',             // city-wide report history
  'report:ack',
  'report:resolve',
  'demo:simulate',
  'demo:reset',
  // barangay-scoped (row filter applied in services)
  'barangay:read:own',
  'vulnerability:read:own',
  'alert:read:own',
  'source:read:own',
  'report:read:own',
  'report:create',
  // resident public status
  'status:read:public',
] as const
```

**Grants:**

```ts
water-officer:      dashboard:read, barangay:read, vulnerability:read, alert:read,
                    source:read, report:read, report:ack, report:resolve,
                    demo:simulate, demo:reset
drrm-officer:       dashboard:read, barangay:read, vulnerability:read, alert:read,
                    source:read, demo:simulate, demo:reset
barangay-official:  barangay:read:own, vulnerability:read:own, alert:read:own,
                    source:read:own, report:read:own, report:create
resident:           status:read:public
barangay-admin:     barangay-official grants + invitation:create, invitation:revoke
```

**Identity model (from `auth-and-permissions.md`):** `User` (email, name, state) → `ExternalIdentity` (provider `google`, `sub` unique) → `Membership` (role + LGU + optional barangay PSGC). JWT payload = `{ sub: userId }`; `JwtStrategy.validate` loads user + active memberships and attaches `req.user = { id, email, role, lguId, barangayId }`. Deny-by-default when membership/scope is missing or ambiguous.

## 5. Milestones (dependency-ordered)

Each milestone lists tasks, personas served, and exit criteria. No duration estimates; ordering reflects dependencies. M0–M7 must complete before Level 1 submission; M8–M9 are Level 2 + production-path.

---

### M0 — Baseline harden & reconcile

**Tasks**
- [ ] Remove stale build output (`backend/dist`, `frontend/dist`) and confirm `src` is the single source of truth.
- [ ] Verify `backend` installs/builds with the declared `typeorm` version; pin a known-good version if `^1.1.1` fails (`npm ci` + `npm run build` in `backend/`).
- [ ] Confirm `docker compose up` boots db + api + web cleanly (fresh volume).
- [ ] Move real Google OAuth/JWT secrets out of committed `backend/.env`; keep local `.env` (gitignored) + document in `.env.example`. Regenerate or mark demo-only.
- [ ] Remove the stray `console.log(payload)` from `jwt.strategy.ts`.
- [ ] Add `zod` to `frontend/package.json` (mirrored schemas; no shared package — see §6).

**Exit:** `docker compose up` green; both apps `npm run build` green from a clean clone (secrets placeholder-safe).

---

### M1 — Backend domain entities + deterministic seeder

**Tasks**
- [ ] TypeORM entities mirroring `docs/architecture.md` §4: `WaterSource`, `WaterSystem`, `ServiceStatus`, `Community` (with `boundary` geometry/JSON), `CommunityReport`, `Alert` (derived — see M2). Register in `TypeOrmModule.forFeature` per module.
- [ ] Idempotent seeder (`backend/src/db/seed/`): import all 57 polygons from `seed-data/catbalogan-brgys.geojson` (keyed by `psgc_code`; compute centroid, `areaSqKm`, `distanceToCenterKm`), upsert-by-PSGC so re-runs never duplicate.
- [ ] Deterministic water inputs: 4+ `WaterSource`, 5 pilot `WaterSystem` (levels I/II/III), initial `ServiceStatus` sample series, fixed via `baseSeed = 20261006` + `mulberry32` RNG.
- [ ] Seed initial status inputs that *produce* one active critical alert and one resolved alert (alerts still derived in M2).
- [ ] Wire seeder into API boot (`OnApplicationBootstrap`), guarded so it runs before controllers serve.

**Personas:** all (foundation).

**Exit:** on boot, `GET /api/barangays` (stub controller or direct repo check) returns 57 records with computed `distanceToCenterKm`; re-boot yields identical rows.

---

### M2 — Derived logic services + read API

**Tasks**
- [ ] `alerts.service` implementing `docs/architecture.md` §5.1 rules (outage/contamination/shortage severities, declining-trend early warning, vulnerability escalation).
- [ ] `metrics.service` §5.2 (access coverage, reliability, affordability, active alerts, composite score, status band).
- [ ] `vulnerability.service` §5.3 (isolation from polygon area+distance, structural tier from level + capacity margin).
- [ ] Controllers + Zod DTOs for: `GET /api/status`, `GET /api/alerts`, `GET /api/sources`, `GET /api/barangays` (incl. `boundary` + derived `accessState` + `vulnerabilityTier`), `GET /api/barangays/:id`, `GET /api/metrics`.
- [ ] `GET /api/barangays/:id/public` — resident-only DTO (plain-language status + alerts + contact/action; no internal metrics).

**Personas:** water-officer (dashboard/map/alerts), drrm-officer (alerts+vulnerability), resident (public status).

**Exit:** response shapes parse through the shared Zod schemas; changing a seeded flow/quality value changes the derived alert/metric deterministically.

---

### M3 — Write paths: reports + demo controls

**Tasks**
- [ ] `POST /api/reports` (Zod-validated `{ type, description }`, area derived server-side) → persist `CommunityReport(status:'new')` → re-derive alerts.
- [ ] Report lifecycle: `ack` / `resolve` endpoints (water-officer), each re-deriving alerts.
- [ ] `POST /api/demo/simulate` (`typhoon|drought|contamination|maintenance`, `targetSystemId`) → append deterministic `ServiceStatus` samples → re-derive.
- [ ] `POST /api/demo/reset` → truncate + re-run seeder.
- [ ] All writes trigger TanStack Query invalidation surface later (contract: return updated read-model or 204).

**Personas:** barangay-official (submit + feedback), water-officer (triage), drrm-officer (rehearsal).

**Exit:** report insert → new alert appears in re-derived `/api/alerts`; simulate typhoon → outage alert + lower reliability; reset → known-good.

---

### M4 — Real auth: Google OIDC + JWT + RBAC

**Tasks**
- [ ] Finish `AuthService.generateTokens` (access + refresh; issue access as `Secure/HttpOnly/SameSite` cookie and/or Bearer) and `auth.controller` Google callback: validate `state`/`nonce`, verify token signature/issuer/audience/expiry, resolve or create user via `findOrCreateFromGoogle`, issue session.
- [ ] Add `ExternalIdentity` + `Membership` entities (with `Invitation` only if M9 is taken now).
- [ ] Rewrite RBAC files to §4 (replace stale loan-domain tokens): `common/rbac/permissions.ts`, `common/enum/user_roles.enum.ts`, `common/rbac/role_permissions.ts`, `guards/permission.guard.ts`, `@Permissions()` decorator.
- [ ] `JwtStrategy.validate` → attach `{ id, email, role, lguId, barangayId }`; `PermissionGuard` enforces tokens; scope filter applied in service/repository queries via `barangayId`.
- [ ] **Pre-seed demo roles by verified email**: a seed table mapping known Google emails → role + barangay (water-officer, drrm-officer, one barangay-official per pilot barangay, one resident).
- [ ] Gate all M2/M3 endpoints behind guards per §4; leave `GET /api/barangays/:id/public` reachable for `resident`.
- [ ] Session plumbing: cookie-parser already installed; enable it in `main.ts` if not already.

**Personas:** all four (sign-in + enforced permissions).

**Exit:** cross-role tests pass (§7): barangay-official cannot read another barangay or call `demo:simulate`; resident cannot read internal metrics; unauthenticated denied.

---

### M5 — Frontend foundation

**Tasks**
- [ ] Add `QueryClientProvider` (TanStack Query) + router integration in `main.tsx`/`__root.tsx`.
- [ ] API client (`frontend/src/data/`) with typed fetchers + Zod parsing per endpoint; mirror backend Zod schemas in `frontend/src/data/schemas.ts` and TS types in `frontend/src/data/types.ts` (matches `architecture.md` §4 naming).
- [ ] Query hooks: `useStatus/useAlerts/useSources/useBarangays/useBarangay/useMetrics/useReports` + mutations (`submitReport`, `ackReport`, `resolveReport`, `simulate`, `reset`) with invalidation.
- [ ] Auth client: Google sign-in redirect, session bootstrap (`GET /api/auth/me`), sign-out.
- [ ] App shell + navigation (water-officer/drrm-officer/barangay-official/resident), role-aware route/menu gating (client-side, mirrored by server guards).
- [ ] shadcn/ui + `@base-ui` primitives set up (Button, Card, Badge, Select, Tabs, Toast), status color system (secure/watch/critical) with text + icon (never color-only).

**Personas:** all (shared shell).

**Exit:** build green; `vite dev` renders shell; each query returns parsed, typed data with loading/error/retry states.

---

### M6 — Persona views

**Tasks**
- [ ] **water-officer** — dashboard banner + KPI cards (coverage/reliability/affordability/active alerts + score breakdown); coverage map (57 inline-SVG polygons colored by derived `accessState`, source markers, service level, vulnerability tier); per-barangay drill-down (trend, vulnerability breakdown, open reports, alerts); alerts list (priority-sorted, underserved-first, plain-language action + impact note); report triage (ack/resolve).
- [ ] **drrm-officer** — alerts list with response priority; coverage map with vulnerability overlay; demo controls (`simulate`/`reset`).
- [ ] **barangay-official** — report form (type + description, area pinned to own barangay), own status card, own report history with status badges (feedback loop).
- [ ] **resident** — barangay lookup → 5-second status answer (available/safe/affordable), plain-language alerts, "who to contact / what to do".

**Personas:** 1, 4, 2, 3 respectively.

**Exit:** every Must feature (`plan.md` §4) walkable end-to-end under the correct role; cross-role UI gating matches server enforcement.

---

### M7 — Integration, QA, deploy, demo prep

**Tasks**
- [ ] Fresh-boot smoke test via `docker compose up`; verify deterministic seed + one active critical + one resolved alert.
- [ ] `Reset demo` restores known-good; `Simulate` reacts live without refresh.
- [ ] Accessibility pass (semantic HTML, ≥44px targets, WCAG AA contrast, icon+text status).
- [ ] `npm run lint` + `npm run build` green in **both** apps at the frozen commit.
- [ ] Public deployment (single VPS/LGU server: built SPA via nginx → API → Postgres, per `compose.yaml`/`nginx.conf`).
- [ ] Fill `docs/submission.md` (URL, repo, team, attribution); freeze feature set.
- [ ] Deck + timed demo rehearsal (`docs/pitch-outline.md` §3), Google-sign-in walkthrough per role, and a documented fallback if venue Wi-Fi blocks Google OIDC.

**Personas:** all.

**Exit:** Level 1 checklist (`submission.md`) complete; demo runs end-to-end twice, timed.

---

### M8 — Level 2 refinements (post-Top-4)

- [ ] Apply Level 1 judge feedback; harden UX (`lgu-ux-design` skill).
- [ ] Second browser smoke test; re-verify public URL after changes.
- [ ] Updated 5-minute deck + Q&A bank review.

---

### M9 — Production-path stretch (only if M0–M8 green)

- [ ] Barangay-admin invitation flow (`auth-and-permissions.md`): `Invitation` entity (hashed token, expiry, single-use), invite/revoke, atomic one-time acceptance via Google OIDC (deliver link by copy — no SMTP dependency).
- [ ] Telemetry ingestion job (`@nestjs/schedule`) writing `ServiceStatus` samples; keep §5 rules unchanged.
- [ ] Multi-LGU tenancy on entities (scope by LGU id).

---

## 6. Data model & contract notes (decisions)

- Entities/field names frozen as in `architecture.md` §4; `accessState` and `vulnerabilityTier` are **derived read-models, never stored**.
- Zod schemas live in `backend` (source of truth) and are **mirrored** in `frontend/src/data/schemas.ts` (no shared package — avoids build tooling; drift caught by a response-parse fail-loudly in dev).
- Geometry: store barangay `boundary` as JSON (GeoJSON polygon) in Postgres, serve to SPA for client-side inline-SVG projection (no tiles/keys).

## 7. Validation plan

- **Determinism:** boot twice → identical rows; `reset` returns to seed state.
- **Derivation:** mutate one signal (flow/quality/available) → assert the exact expected alert/metric change.
- **RBAC (negative + positive):** water-officer reads all; barangay-official blocked on other barangays and on `demo:*`/`report:ack`; resident blocked on internal metrics; forged client scope ignored (area derived server-side); missing/disabled membership → 401/403.
- **Build/lint:** `backend` `npm run lint && npm run build`; `frontend` `npm run lint && npm run build`; `docker compose up` fresh-boot.
- **Demo smoke:** `docs/pitch-outline.md` §3 click-path, incl. a Google sign-in per persona.

## 8. Risks & failure modes

| Risk | Mitigation |
| :--- | :--- |
| Google OIDC needs network + configured redirect URI at venue | Pre-configure `GOOGLE_CALLBACK_URL` for localhost + prod; document offline fallback in `submission.md`; keep demo reset/simulate independent of auth. |
| `typeorm@^1.1.1` may not build | M0 pin verified version before writing entities. |
| Committed secrets | M0 regenerate/mark demo-only; gitignore real `.env`. |
| RBAC token drift (union vs grants) | Single `PERMISSIONS` array as source; type error if grants reference unknown token. |
| 57-polygon SVG perf | Project/simplify client-side; lazy-render polygons; cache static barangay query. |
| Stale `dist/` confusing state | M0 delete; treat `src` as truth. |

## 9. Open questions (non-blocking)

- Whether `Invitation` + `barangay-admin` (M9) is required for Level 2 or can remain documented-only. Default: documented-only unless time remains after M8.
- Exact upstream attribution for `catbalogan-brgys.geojson` (flagged in `submission.md` for final confirmation).
