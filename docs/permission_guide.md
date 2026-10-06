# Roles & Permissions (water domain)

This is the runtime permission model for the WellPoint prototype. It replaces the earlier loan-domain RBAC draft; everything below matches the code actually running in `frontend/src/lib/water-store.ts` and the Supabase policies in `supabase/schema.sql`.

## Roles

`citizen | official | lgu | drrm` (see `docs/system-design.md` Part 1 for the full matrix). The role is stored in the Supabase `profiles` table and loaded by `lib/auth.ts`; the dashboard renders the matching persona view.

## What each role can do with water sources

Two static maps in `frontend/src/lib/water-store.ts` define the capabilities:

```ts
// Who may place (create/delete) each asset kind on the map.
export const CAN_PLACE: Record<Role, AssetKind[]> = {
  lgu: [],
  drrm: ['station'],
  official: ['pump', 'well', 'reservoir'],
  citizen: [],
}

// Who may reposition (drag) an existing marker. Separate from CAN_PLACE so
// move rights can differ from add/delete rights; currently the same.
export const CAN_MOVE: Record<Role, AssetKind[]> = {
  lgu: [],
  drrm: ['station'],
  official: ['pump', 'well', 'reservoir'],
  citizen: [],
}

// Who may change the status of each asset kind.
export const CAN_SET_STATUS: Record<Role, AssetKind[]> = {
  lgu: [],
  drrm: ['station'],
  official: ['pump', 'well', 'reservoir'],
  citizen: [],
}
```

Asset kinds: `pump | well | reservoir | station`. Source statuses: `ok | low | empty | repair | unsafe`.

## Enforcement

- **Frontend:** the maps above gate the UI — drag/drop palette, marker move rights (`CAN_MOVE`), marker delete rights (`CAN_PLACE`), and the status select. This is presentation-only convenience.
- **Database (authoritative):** Supabase row-level security mirrors the same rules via `public.can_place(kind, barangay_psgc)` and `public.can_set_status(kind, barangay_psgc)` (defined in `supabase/schema.sql`), which read the caller's role and barangay from `profiles`.

## Reports and alerts

- Any signed-in user may **insert** a report.
- `lgu` may **acknowledge / resolve** any report city-wide; `official` may do so for their own barangay. The `reports` RLS policies enforce `public.can_triage_report(barangay_psgc)` for update/delete.
- The **Alerts** page lets `lgu` and `official` resolve an active alert's cause directly: `lgu` resolves report-derived and authored-warning alerts, `official` resolves report-derived and source-status alerts in their own barangay. System-status alerts are cleared from the **Systems** page by `lgu`/`drrm`.

## Warnings

- Only `drrm` may **issue** an early warning (`warnings_insert`, `warning_barangays_insert` enforce `user_role() = 'drrm'`).
- `lgu` may **resolve / cancel** any warning for oversight; the `drrm` author may resolve their own. Both are enforced by the `warnings_update` policy.

## Rule of thumb

Keep the "add the capability to `CAN_PLACE`/`CAN_MOVE`/`CAN_SET_STATUS` first, then mirror it in the SQL helper" convention so the UI maps and the database policies stay in sync.
