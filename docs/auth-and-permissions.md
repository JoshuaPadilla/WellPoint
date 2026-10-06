# Authentication and Permissions

This document describes authentication and authorization for WellPoint: what exists today (Supabase email/password Auth + a `profiles` role), and the Google sign-in / barangay-admin design target for production.

## What exists today

- **Sign-in is real.** `frontend/src/lib/auth.ts` uses Supabase Auth (email/password) with `register`, `login`, `logout`, `getUser`, and `refreshProfile`.
- **Profiles.** On signup a `profiles` row is created (`name`, `barangay`, `email`, `role`). The `role` field drives which persona view the dashboard renders.
- **Roles.** `citizen | official | lgu | drrm` (see `docs/system-design.md` Part 1). There is no role-management UI in the prototype — the role is set in the `profiles` table.
- **Enforcement.** Supabase row-level security gates writes: `can_place()` / `can_set_status()` for `water_sources`, and `lgu`/`official`-only acknowledge/resolve for `reports` (see `supabase/schema.sql`). Read scoping is demonstrated at the presentation layer.

## Goals (production path)

- Let invited barangay officials sign in with Google.
- Allow a barangay administrator to invite officials only for their own barangay.
- Keep identity (who signed in) separate from application roles (what they may do).
- Enforce every permission and data scope in the database (RLS), not only in the frontend.
- Preserve the existing city-wide `lgu` and `drrm` roles.

## Roles and scope

Roles are assigned by WellPoint; a Google account does not grant a role by itself.

| Role | Scope | Permissions |
| --- | --- | --- |
| `barangay-admin` (future) | One barangay | Invite, revoke pending invitations, and manage `official` memberships for that barangay. |
| `official` | One barangay | View that barangay's permitted status and alerts; create reports for that barangay; view its report history. |
| `lgu` | One LGU/city | Read city-wide data and acknowledge or resolve reports, subject to the access matrix. |
| `drrm` | One LGU/city | Read city-wide alerts and vulnerability data and use demo/disaster-planning functions. |
| `citizen` | Public or one barangay | Read only the public status information intended for residents. An account can be optional. |

The `barangay-admin` role is an addition to the current four-role design. It is deliberately barangay-scoped: it is not a system-wide administrator. The initial policy should not allow barangay admins to invite other admins, assign arbitrary roles, or change an official's barangay.

## Google sign-in and invitation flow (future)

1. **Create an invitation.** An authenticated `barangay-admin` submits the invitee's email. The server derives the admin's barangay from their active membership; it does not accept the target barangay as authoritative client input. The server creates an invitation for that barangay with the fixed role `official`.
2. **Deliver a one-time link.** Send the invite URL to the invitee. Store only a hash of its cryptographically random token. Give the invitation an expiry and allow it to be revoked.
3. **Authenticate with Google.** The invitee follows the link and completes Google's OpenID Connect authorization flow (authorization-code with state/nonce; validate signature, issuer, audience, expiry, and verified-email).
4. **Match the invitation.** Normalize the verified email and match it to a pending, unexpired invitation. The invitee cannot change the role or barangay in the browser.
5. **Accept once and create membership.** In a transaction, consume the invitation and create/link the WellPoint user, Google identity, and `official` membership. Enforce single use.
6. **Create the session.** On future sign-ins, resolve the account through Google's stable `sub` claim, then load current memberships and permissions.

Prefer a server-managed session or short-lived application token in a `Secure`, `HttpOnly`, `SameSite` cookie over long-lived tokens in `localStorage`.

## Authorization and data scoping

1. Authenticate the request and resolve the WellPoint user.
2. Load active membership(s) from the database; do not trust role, barangay, or LGU claims supplied by the client.
3. Use Supabase RLS policies (and, in production, a small edge-function/API layer) for protected reads and writes.
4. Apply scope within queries. For a barangay official, derive the allowed barangay from the active membership and filter by it.
5. For writes, derive ownership and scope server-side (e.g., set a report's `area` from the official's membership).
6. Return only the fields appropriate to the role. A public resident view should return a limited public-status read, not internal metrics.
7. Deny by default when authentication, membership, or scope is missing or ambiguous.

## Barangay invitation rules

- Only an active `barangay-admin` can issue invitations.
- The admin can invite only for the barangay in their active membership.
- The only role they can invite is `official`.
- The system sets the invitation's barangay from the admin's membership.
- Invitations are email-bound, expire, are single-use, and can be revoked before acceptance.
- Acceptance requires the Google-verified email to match the invitation.
- Admins cannot promote themselves, assign city-wide roles, invite other admins, or move existing officials across barangays.

## Implementation checklist (production)

1. Add identity, membership, and invitation tables and constraints.
2. Implement Google OIDC login and application-session handling.
3. Add RLS policies and query-level tenant/barangay scoping.
4. Implement invitation creation, delivery, revocation, and atomic one-time acceptance.
5. Add audit events for invitation and membership changes.
6. Test denied access as well as success: cross-barangay reads/writes, forged client scope, expired/reused invitations, mismatched email, disabled memberships, and role escalation attempts.

Until those checks exist, the prototype's role field must not be treated as a security boundary beyond what Supabase RLS already enforces.
