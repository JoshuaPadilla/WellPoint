# Authentication and Permissions

This document describes a proposed production authentication and authorization design for WellPoint. It is a design target, not an implemented feature: the current prototype has no login and its role-mode switcher is for demonstration only. See [system-design.md](./system-design.md) for the existing persona and permission matrix.

## Goals

- Let invited barangay officials sign in with Google.
- Allow a barangay administrator to invite officials only for their own barangay.
- Keep identity (who signed in) separate from application roles (what they may do).
- Enforce every permission and data scope in the API, not only in the frontend.
- Preserve the existing city-wide `water-officer` and `drrm-officer` roles.

## Roles and scope

Roles are assigned by WellPoint; a Google account does not grant a role by itself.

| Role | Scope | Permissions |
| --- | --- | --- |
| `barangay-admin` | One barangay | Invite, revoke pending invitations, and manage `barangay-official` memberships for that barangay. |
| `barangay-official` | One barangay | View that barangay's permitted status and alerts; create reports for that barangay; view its report history. |
| `water-officer` | One LGU/city | Read city-wide data and acknowledge or resolve reports, subject to the existing access matrix. |
| `drrm-officer` | One LGU/city | Read city-wide alerts and vulnerability data and use authorized disaster-planning functions. |
| `resident` | Public or one barangay | Read only the public status information intended for residents. An account can be optional. |

The `barangay-admin` role is an addition to the current four-role design. It is deliberately barangay-scoped: it is not a system-wide administrator. The initial policy should not allow barangay admins to invite other admins, assign arbitrary roles, or change an official's barangay.

## Google sign-in and invitation flow

1. **Create an invitation.** An authenticated `barangay-admin` submits the invitee's email. The API derives the admin's barangay from their active membership; it does not accept the target barangay as authoritative client input. The server creates an invitation for that barangay with the fixed role `barangay-official`.
2. **Deliver a one-time link.** Send the invite URL to the invitee. Store only a hash of its cryptographically random token. Give the invitation an expiry and allow it to be revoked.
3. **Authenticate with Google.** The invitee follows the link and completes Google's OpenID Connect authorization flow. Use a server-validated authorization-code flow with state and nonce checks. Validate the token's signature, issuer, audience, expiry, and verified-email claim.
4. **Match the invitation.** Normalize the verified email and match it to a pending, unexpired invitation. The invitee cannot change the role or barangay in the browser. If there is no valid invitation, do not grant staff access.
5. **Accept once and create membership.** In a database transaction, consume the invitation and create or link the WellPoint user, Google identity, and `barangay-official` membership using the role and barangay stored on the invitation. Enforce single use so concurrent acceptance attempts cannot create duplicate or altered memberships.
6. **Create the WellPoint session.** Issue an application session after successful acceptance. On future sign-ins, resolve the account through Google's stable `sub` claim (provider subject), then load the user's current active memberships and permissions from the database.

For a browser client, prefer a server-managed session or short-lived application token in a `Secure`, `HttpOnly`, appropriately `SameSite` cookie. Do not put long-lived Google tokens or application credentials in `localStorage`. Account linking or email changes should require a deliberate, verified process; email alone is not a permanent identity key.

## Suggested data model

Keep identity, membership, and invitations separate so roles can change without changing the external identity.

### `User`

- Internal primary key.
- Normalized, verified email and display name.
- Active/disabled state and timestamps.

### `ExternalIdentity`

- User foreign key.
- Provider name, initially `google`.
- Provider subject (`sub`), unique together with provider.

Do not use a mutable email address as the unique external identity. A user's Google identity is identified by the validated provider subject.

### `Membership`

- User foreign key.
- Role.
- LGU/tenant foreign key.
- Optional barangay foreign key or PSGC code.
- Active state and timestamps.

Require a barangay scope for `barangay-admin` and `barangay-official`. Require an LGU scope for city-wide staff roles. Validate these rules in the service layer and, where practical, with database constraints. A membership table supports multiple roles or scopes for one person without embedding role state in the Google identity.

### `Invitation`

- Normalized invitee email.
- Fixed intended role and barangay/LGU scope.
- Inviter membership/user.
- Hash of a random, single-use token.
- Expiry, accepted, and revoked timestamps.
- Creation timestamp.

Record enough audit information to answer who invited an account, for which barangay, and when it was accepted or revoked. Never store the raw invitation token.

## Authorization and data scoping

1. Authenticate the request and resolve the WellPoint user.
2. Load active membership(s) from the database; do not trust role, barangay, or LGU claims supplied by the client.
3. Use NestJS authentication guards and permission/role guards on protected routes.
4. Apply scope within service/repository queries. For a barangay official, derive the allowed PSGC code from the active membership and filter the query by it.
5. For writes, derive ownership and scope on the server. For example, set a report's barangay from the official's membership rather than accepting a `barangayId` from the request.
6. Return only the fields appropriate to the role. A public resident endpoint should return a limited public-status DTO, not internal metrics or unrestricted alert/report records.
7. Deny by default when authentication, membership, or scope is missing or ambiguous. Hiding a menu item or route in the UI is not authorization.

For privileged actions, such as creating invitations or resolving reports, verify both the required permission and the entity's scope on every request. Revoke sessions or otherwise invalidate authorization promptly when a user or membership is disabled.

## Barangay invitation rules

- Only an active `barangay-admin` can issue invitations.
- The admin can invite only for the barangay in their active membership.
- The only role they can invite is `barangay-official`.
- The API sets the invitation's barangay from the admin's membership.
- Invitations are email-bound, expire, are single-use, and can be revoked before acceptance.
- Acceptance requires the Google-verified email to match the invitation.
- A public sign-up or Google sign-in without a valid invitation creates no staff membership.
- Admins cannot promote themselves, assign city-wide roles, invite other admins, or move existing officials across barangays.

If administrative responsibilities later need to be delegated, add an explicit audited workflow rather than broadening the barangay admin's authority implicitly.

## Implementation checklist

1. Add the identity, membership, and invitation entities and database constraints.
2. Implement Google OIDC login and application session handling.
3. Add authentication and permission guards, plus query-level tenant/barangay scoping.
4. Implement invitation creation, delivery, revocation, and atomic one-time acceptance.
5. Add audit events for invitation and membership changes.
6. Test denied access as well as successful access: cross-barangay reads/writes, forged client scope, expired/reused invitations, mismatched email, disabled memberships, and role escalation attempts.

Until those API and database checks exist, the prototype's role switcher must not be treated as access control or exposed as a production security boundary.
