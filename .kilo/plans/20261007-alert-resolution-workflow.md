# WellPoint — Alert Resolution Workflow (implementation plan)

**Goal:** every alert type can be realistically updated by its responsible role, and every update reflects across all users in real time — without "Reset demo" being the only way to clear a system alert.

**Context:** Level 1 pre-judging is Oct 7, 10:00 AM. This is a feature change, not a rewrite. Typecheck + build must stay green and the known-good demo must still boot deterministically.

---

## 0. Implementation note (Oct 6, post-build)

The build went further than §2–4 below: the LGU/Water-District editor is now **per-barangay, not per-system**, and the barangay drill-down gained source count + official directory.

- `system_status` table was **replaced by `barangay_status`** (keyed by `psgc_code`, fields: `available`, `flow`, `quality`, `affordability`), writeable by **LGU only**. "Simulate disruption" and the editor share this one table.
- New **`barangay_officials`** table (readable by all signed-in users, managed by LGU) feeds the map drill-down.
- New **`/dashboard/systems` route → "Water status"** (LGU-only): searchable editor for **all 57 barangays** (served toggle, flow %, quality select, affordability), with "Restore seeded".
- Map info card now shows: water-source count, serving system (level/hours), and official contact(s).
- Status derives as: `barangay_status` row → seed ticks (pilot) → isolation baseline (non-pilot). Effective affordability also flows into access state, metrics, and vulnerability.

The rest of this file describes the original reasoning; §1 "who updates what" is still accurate.

---

## 1. Current state (from code)

| Alert source | Who clears it today | Where | Status |
| :--- | :--- | :--- | :-: |
| Report alert (`report.status === 'new'`) | Barangay official → **Acknowledge / Resolve** | `dashboard.reports.tsx:170-179`, `setReportStatus` (`water-store.ts:492`), RLS `can_triage_report` (own barangay only) | ✅ works |
| Warning alert (authored) | LGU or DRRM author → **Resolve / Cancel** | `dashboard.warnings.tsx:173-182`, `setWarningStatus` (`water-store.ts:541`) | ✅ works |
| Source-status alert (`water_sources.status`) | Official (own barangay) / DRRM (stations) — status dropdown in the map marker popup | `WaterAssets.tsx:104-120` → `setStatus` (`water-store.ts:467`), RLS `can_set_status` | ✅ works (already live) |
| **System-status alert** (offline / flow<25 / unsafe from pilot ticks) | **Nobody** — derived from seed ticks + client-only disruption | `effectiveStatus` (`derive.ts:17`), `simulateDisruption` (`water-store.ts:568`) | ❌ **gap** |

**The gap in one sentence:** a system alert can only be cleared by `resetDemo` (`water-store.ts:572`), which also deletes every report and warning and resets every source — a sledgehammer, and not a believable "service restored" flow for a judge.

---

## 2. Decision: one persisted source of truth for system status

**Replace the client-only disruption with a persisted `system_status` override table.** One table backs both "Simulate disruption" and "Restore service", so:

- An LGU/DRRM "restore" is a real, durable, cross-user action (matches the user's requirement: *update in one place, reflected to all users*).
- A simulated typhoon now survives a reload (more honest demo).
- `resetDemo` clears the table → deterministic known-good state preserved.

### 2.1 Priority order in derivation

```
persisted override (system_status row)  →  if absent, seed ticks  (no more client disruption path)
```

`simulateDisruption(type, systemId)` writes a row; `restoreSystem(systemId)` deletes the row; `resetDemo()` deletes all rows. The in-memory `state.disruption` becomes just an optimistic mirror and can be removed.

### 2.2 Override values → derived status mapping

| UI label (select) | Persisted row | Derived `ServiceStatus` |
| :--- | :--- | :--- |
| Normal (restore) | *no row* | seed ticks (known-good) |
| Low flow | `{ reason: 'low-flow' }` | `{ available: true, flow: 35, quality: 'safe', reason: 'low-flow' }` → shortage warning |
| No water | `{ reason: 'outage' }` | `{ available: false, flow: 0, quality: 'safe', reason: 'outage' }` → outage critical |
| Contamination | `{ reason: 'contamination' }` | `{ available: true, flow: 45, quality: 'unsafe', reason: 'contamination' }` → contamination critical |
| Advisory | `{ reason: 'advisory' }` | `{ available: true, flow: 60, quality: 'advisory', reason: 'advisory' }` → contamination warning |

All five flow through the existing `systemAlert()` rules in `alerts.ts` unchanged, so the alerts, score penalty, sort priority, and insights all react automatically.

---

## 3. Implementation steps

### Step 1 — Schema (`supabase/schema.sql`)

```sql
create table public.system_status (
  system_id uuid primary key references public.water_systems (id) on delete cascade,
  status text not null check (status in ('low-flow','outage','contamination','advisory')),
  set_by uuid references public.profiles (id),
  updated_at timestamptz not null default now()
);
alter table public.system_status enable row level security;
create policy "system_status_read" on public.system_status for select to authenticated using (true);
create policy "system_status_write" on public.system_status for insert to authenticated
  with check (public.user_role() in ('lgu','drrm'));
create policy "system_status_update" on public.system_status for update to authenticated
  using (public.user_role() in ('lgu','drrm')) with check (public.user_role() in ('lgu','drrm'));
create policy "system_status_delete" on public.system_status for delete to authenticated
  using (public.user_role() in ('lgu','drrm'));
```

- **Who may write:** LGU (all) and DRRM (all) — the water-office/operator role, not the barangay. Barangay officials already control reports and sources, which is the correct division per RLS.
- Add `drop table if exists public.system_status cascade;` to the top of the file, and `delete from public.system_status;` to `resetDemo`.

### Step 2 — Store (`frontend/src/lib/water-store.ts`)

- Add `overrides: Record<string, ServiceStatus>` to state.
- `loadSystemStatus()`: fetch rows, map each via §2.2 into `ServiceStatus`, store in `state.overrides`. Call it in `initWaterStore()` and subscribe `.on('postgres_changes', { table: 'system_status' }, ...)` next to the existing subscriptions (`water-store.ts:387-403`).
- New functions (mirror `setStatus`'s optimistic + save pattern at `water-store.ts:467`):
  - `setSystemStatus(systemId, override)` → upsert row, update `state.overrides`.
  - `restoreSystem(systemId)` → delete row, drop entry from `state.overrides`.
- Refactor `simulateDisruption(type, systemId)` to call `setSystemStatus` with the mapping for that type instead of mutating a client-only `disruption`; `resetDemo()` additionally deletes all `system_status` rows.

### Step 3 — Derivation (`frontend/src/lib/derive.ts`)

- `effectiveStatus(community, disruption)` → `effectiveStatus(community, overrides)`; read `overrides[community.systemId]` first, then seed. `deriveDomain()` gains an `overrides` param threaded from `buildDomain` (`store.ts:44`).
- Delete the now-unused `Disruption` client type (or keep as alias for the override reason) — keep `derive.ts` pure and the change contained.
- `pilotStatus`/`disruptionStatus` in `seed.ts:95-116` can stay as helpers or move the mapping into `water-store.ts`; prefer moving the mapping next to the UI so the seed file stays purely deterministic.

### Step 4 — UI: system status manager

- **New route** `/dashboard/systems`, role-gated `['lgu','drrm']`, listed in `dashboard.tsx:63-97` nav with a `Gauge` icon (or reuse `SlidersHorizontal`). Per system card:
  - name + barangay, service level, operator, current derived flow/quality (live from `useDomain`),
  - a status `<select>` (Normal / Low flow / No water / Contamination / Advisory) → `setSystemStatus`,
  - a **Restore service** button when an override is active → `restoreSystem`.
  - On save, no refresh needed: the `postgres_changes` subscription recomputes the domain and the alert disappears from every screen.
- **DemoControls** (`DemoControls.tsx`): keep "Simulate disruption" + "Reset demo" as-is; they now write/clear the same table, so the pitch script's "watch the reliability score drop" and "Reset restores known-good" both still hold.

### Step 5 — Sources page convenience (small, optional)

Add the same status `<select>` from the marker popup to each row in `dashboard.sources.tsx` (respecting `CAN_SET_STATUS[role]`), so officials can update sources without opening the map.

---

## 4. Who updates what (final matrix — this is the pitch answer)

| Alert | Role that updates it | Action | Propagation |
| :--- | :--- | :--- | :--- |
| Report | Barangay official (own brgy) | Acknowledge / Resolve | Supabase → realtime → all users |
| Warning | LGU or the DRRM author | Resolve / Cancel | Supabase → realtime → all users |
| Source status | Official (own brgy) / DRRM (stations) | Status dropdown | Supabase → realtime → all users |
| Barangay status (flow/quality/affordability) | LGU water office / water district only | Water status editor → Save / Restore seeded | Supabase → realtime → all users |

A barangay official **never** clears a system/barangay-level water alert — that is the water office's call, matching reality.

---

## 5. Verification checklist

1. `cd frontend && npm run typecheck && npm run build` — green.
2. Apply updated `supabase/schema.sql`; fresh load → known-good state unchanged (Canlapwas contamination alert active, Mercedes resolved, score band Watch).
3. Smoke flows (each with a different demo account):
   - LGU/DRRM: Alerts page → set **Poblacion 1 → No water** on the Systems page → critical outage alert appears for everyone; **Restore service** → alert clears everywhere without refresh.
   - Official: submit a report as a citizen, resolve it as the official → alert clears city-wide.
   - DRRM: issue a warning, resolve it → alert clears.
   - DemoControls: Simulate typhoon on San Andres → reliability drops; **Reset demo** → known-good restored (including `system_status` cleared).
4. Rehearse the updated demo path and update `docs/pitch-deck-level1.md` Q&A ("how does an alert get cleared?") with the system-status story.

---

## 6. Effort & cut line

| Step | Est. | Notes |
| :--- | :--- | :--- |
| 1 schema | 20 min | one table + policies + seed guard |
| 2 store | 45–60 min | load/upsert/delete + subscription + refactor `simulateDisruption`/`resetDemo` |
| 3 derive | 30 min | thread `overrides`, remove client disruption |
| 4 systems route + nav | 60–90 min | form + live values + role gate |
| 5 sources page select | 30 min | optional |
| QA + demo retest | 60 min | must include the two smoke flows |

**Cut line:** if time runs short before the 8:00 AM submission, ship Steps 1–3 + a barebones Systems page (select + restore only). That already closes the judge-visible gap. Step 5 and polish are post-submission.

---

## 7. Risks

- **Determinism:** overrides must be cleared by `resetDemo`, or the fresh-load demo changes. Mitigated by Step 2 + verification flow 3.
- **RLS:** write scoping to `lgu`/`drrm` prevents a barangay official from "restoring" a system they don't operate — intentional.
- **Two-state confusion:** until Step 3 lands, `state.disruption` and the new table both exist; land Steps 2+3 together so only one path is live.
- **Demo script drift:** the 5-minute script's "simulate typhoon → score drop → reset" still works because DemoControls now writes the same table; verify timing after the refactor.
