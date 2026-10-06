# WellPoint — Authentication & Permissions

> **Scope.** This describes the RBAC and auth that actually run in `backend/`.
> It replaced the earlier loan-domain guide (admin/manager/staff/viewer/pending);
> those roles and files no longer exist.

## What kind of system is this?

**Static Role-Based Access Control (RBAC) with string permission tokens.** No
CASL, no wildcards, no attribute conditions. A fixed `role → permission[]`
matrix is enforced by a global guard, plus **barangay scoping** (`:own`) so a
barangay-scoped user only ever sees their own barangay.

- A single union type `Permission` defines every capability as an atomic
  `resource:action` string, e.g. `'alert:read'`, `'report:ack'`.
- `ROLE_PERMISSIONS: Record<UserRoles, readonly Permission[]>` statically
  grants each role its set.
- Authorization is checked per endpoint: handlers declare required permissions
  via `@Permissions(...)`; `PermissionGuard` reads the caller's role and allows
  if **any** required permission is granted (any-match, not all-match).
- Handlers with **no** `@Permissions(...)` are authenticated-only (no extra
  permission required).
- **Deny by default:** a user with no active `Membership` (or an ambiguous
  scope) gets `401`/`403`, never a partial view.

## Source files

| File | Purpose |
| :--- | :--- |
| `src/common/rbac/permissions.ts` | `PERMISSIONS` union + `Permission` type |
| `src/common/enum/user_roles.enum.ts` | `UserRoles` enum |
| `src/common/rbac/role_permissions.ts` | role → permission grants |
| `src/common/rbac/permissions.decorator.ts` | `@Permissions(...)` metadata |
| `src/guards/jwt-auth.guard.ts` | `AuthGuard('jwt')` wrapper |
| `src/guards/permission.guard.ts` | enforces `@Permissions(...)` |
| `src/strategy/jwt.strategy.ts` | verifies JWT, loads user + membership |
| `src/strategy/google.strategy.ts` | Google OIDC profile extraction |

## Roles

```ts
enum UserRoles {
  WATER_OFFICER = 'water-officer',
  DRRM_OFFICER = 'drrm-officer',
  BARANGAY_OFFICIAL = 'barangay-official',
  RESIDENT = 'resident',
  BARANGAY_ADMIN = 'barangay-admin',
}
```

## Permission tokens

```ts
const PERMISSIONS = [
  'dashboard:read',
  'barangay:read', 'vulnerability:read', 'alert:read', 'source:read',
  'report:read', 'report:ack', 'report:resolve',
  'demo:simulate', 'demo:reset',
  // barangay-scoped ("own") equivalents
  'barangay:read:own', 'vulnerability:read:own', 'alert:read:own',
  'source:read:own', 'report:read:own', 'report:create',
  'status:read:public',
] as const;
```

## Role → permission grants

| Role | Grants |
| :--- | :--- |
| `water-officer` | dashboard, barangay, vulnerability, alert, source, report (read/ack/resolve), demo (simulate/reset) |
| `drrm-officer` | dashboard, barangay, vulnerability, alert, source, demo (simulate/reset) |
| `barangay-official` | own barangay/vulnerability/alert/source/report read, `report:create` |
| `barangay-admin` | same as `barangay-official` |
| `resident` | `status:read:public` only |

## Guard semantics

- `JwtAuthGuard` runs first: verifies the JWT (Bearer header or `access_token`
  cookie), loads the `User` + active `Membership`, and attaches
  `req.user = { id, email, name, role, lguId, barangayId, permissions }`.
- `PermissionGuard` then reads `@Permissions(...)` and allows if any required
  permission is in `req.user.permissions`. Missing user → `401`; insufficient →
  `403`.
- **Scoping:** city-wide roles (`water-officer`, `drrm-officer`) have no
  `barangayId` and see everything. Barangay-scoped roles have a `barangayId`
  (PSGC) and the controllers filter list/detail results to that barangay. The
  server always derives the barangay from `Membership`, never from client
  input.

## Sign-in flow (Google OIDC + JWT cookie)

1. `GET /api/auth/google` → redirects to Google.
2. `GET /api/auth/google/callback` → resolves/creates the `User` via
   `ExternalIdentity` (provider `google`, subject = Google `sub`), issues an
   access + refresh JWT, sets them as `httpOnly` cookies, redirects to the SPA.
3. `GET /api/auth/me` → returns the current `AuthUser` (profile + permissions).
4. `POST /api/auth/logout` → clears the cookies (stateless).
5. `POST /api/auth/dev-login` → **dev-only** (disabled when
   `NODE_ENV=production`): signs in as a pre-seeded demo account, for demos
   where the venue blocks Google OIDC.

## Demo account seeding

`src/db/seed/auth-seed.ts` pre-seeds four demo accounts (upsert-by-email on
boot) so the RBAC is demonstrable without real Google accounts:

| Email | Role | Barangay |
| :--- | :--- | :--- |
| `water.officer@wellpoint.demo` | water-officer | — |
| `drrm.officer@wellpoint.demo` | drrm-officer | — |
| `barangay.official@wellpoint.demo` | barangay-official | San Andres |
| `resident@wellpoint.demo` | resident | Canlapwas |

## Porting to another project

Copy the permission union, role enum, and grants map. Guard handlers with
`@Permissions(...)` and gate UI with `permissions.includes('...')`. Keep the
convention "add the token to `PERMISSIONS` first, then grant it in
`ROLE_PERMISSIONS`".
