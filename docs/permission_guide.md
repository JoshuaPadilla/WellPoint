# Roles & Permissions (water domain)

This is the runtime permission model for the WellPoint prototype. It replaces the earlier loan-domain RBAC draft; everything below matches the code actually running in `frontend/src/lib/water-store.ts` and the Supabase policies in `supabase/schema.sql`.

## Roles

`citizen | official | lgu | drrm` (see `docs/system-design.md` Part 1 for the full matrix). The role is stored in the Supabase `profiles` table and loaded by `lib/auth.ts`; the dashboard renders the matching persona view.

## What each role can do with water sources

Two static maps in `frontend/src/lib/water-store.ts` define the capabilities:

```ts
// Who may place (create/delete/move) each asset kind on the map.
export const CAN_PLACE: Record<Role, AssetKind[]> = {
  lgu: ['pump', 'well', 'reservoir'],
  drrm: ['station'],
  official: [],
  citizen: [],
}

// Who may change the status of each asset kind.
export const CAN_SET_STATUS: Record<Role, AssetKind[]> = {
  lgu: ['pump', 'well', 'reservoir', 'station'],
  drrm: ['station'],
  official: ['pump', 'well'],
  citizen: [],
}
```

Asset kinds: `pump | well | reservoir | station`. Source statuses: `ok | low | empty | repair | unsafe`.

## Enforcement

- **Frontend:** the maps above gate the UI — drag/drop palette, marker edit rights, and the status select. This is presentation-only convenience.
- **Database (authoritative):** Supabase row-level security mirrors the same rules via `public.can_place(kind)` and `public.can_set_status(kind)` (defined in `supabase/schema.sql`), which read the caller's role from `profiles`.

## Reports

- Any signed-in user may **insert** a report.
- Only `lgu` (and, for their own barangay, `official` in the full matrix) may **acknowledge / resolve** a report. The `reports` RLS policies enforce `user_role() in ('lgu', 'official')` for update/delete.

## Rule of thumb

Keep the "add the capability to `CAN_PLACE`/`CAN_SET_STATUS` first, then mirror it in the SQL helper" convention so the UI maps and the database policies stay in sync.
