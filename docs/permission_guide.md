# RBAC Permission System

> **Hackathon note.** This guide was originally written around a loan-domain
> permission set. For the WellPoint water-app hackathon build the tokens were
> **re-scoped** to the water domain (sources, alerts, deliveries, reports).
> Everything below matches the code actually running in `backend/`.

## What kind of system is this?

**Static Role-Based Access Control (RBAC) with string permission tokens.** It is **not CASL** and not attribute-based (ABAC). There is no CASL library, no wildcards (`*`), and no conditions or attributes — it is a fixed `role → permission[]` matrix enforced by a global guard.

- A single union type `Permission` defines every capability as an atomic string in `resource:action` format, e.g. `'source:update'`, `'user:manage'`. There is no wildcard support.
- A `Record<UserRoles, readonly Permission[]>` map statically grants each role its permission set. Permissions resolve to an empty list for `pending` users.
- Authorization is checked per endpoint: handlers declare required permissions via a `@Permissions('source:update', ...)` decorator (metadata via `SetMetadata`), and a global `PermissionGuard` reads the caller's role from `req.user`, builds a `Set` of granted permissions, and allows the request if the handler's required list intersects it — `required.some((p) => granted.has(p))`, any-match semantics, not all-match.
- Handlers with **no** `@Permissions(...)` decorator are allowed through (authenticated-only baseline).
- Permission checks are **role-derived, not user-specific**: there is no per-user override and no ownership rules.

Authentication is email/password: `POST /api/auth/register` and `POST /api/auth/login` return a signed JWT; `JwtAuthGuard` verifies the HS256 signature against `APP_JWT_SECRET` (falls back to `SUPABASE_JWT_SECRET`), loads the app `User` row by `sub`, and attaches `req.user = { id, email, name, role }`.

## `Permission` type

Source: `backend/src/common/rbac/permissions.ts`

```ts
/** Every atomic capability in the system. Add here first, then grant. */
export const PERMISSIONS = [
  "dashboard:read",

  "source:read",
  "source:create",
  "source:update",
  "source:delete",

  "alert:read",
  "report:read",
  "delivery:read",

  "user:manage", // create users, change roles
  "auditlog:read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];
```

## Role type

Source: `backend/src/common/enum/user_roles.enum.ts`

```ts
export enum UserRoles {
  ADMIN = "admin",
  MANAGER = "manager", // ops lead: edits sources, manages users
  STAFF = "staff", // field editor: reads + updates sources
  VIEWER = "viewer", // read-only citizen/barangay member
  PENDING = "pending", // self-onboarded, no access until a role is granted
}
```

## Role → permission grants

Source: `backend/src/common/rbac/role_permissions.ts`

```ts
export const ROLE_PERMISSIONS: Record<UserRoles, readonly Permission[]> = {
  admin: [...PERMISSIONS], // all

  manager: [
    "dashboard:read",
    "source:read",
    "source:create",
    "source:update",
    "alert:read",
    "report:read",
    "delivery:read",
    "user:manage",
    "auditlog:read",
  ],

  staff: [
    "dashboard:read",
    "source:read",
    "source:create",
    "source:update",
    "alert:read",
    "delivery:read",
  ],

  viewer: ["dashboard:read", "source:read", "alert:read", "delivery:read"],

  pending: [], // zero grants until an admin/manager assigns a real role
};
```

## Guard semantics

Source: `backend/src/guards/permission.guard.ts`

- Global guards run in registration order: `JwtAuthGuard` first (attaches `req.user` from a verified Bearer token), then `PermissionGuard`.
- `PermissionGuard` reads `@Permissions(...)` metadata from the handler and class (controller-level fallback).
- No declared permissions → allow (authenticated-only baseline).
- Builds a `Set` from `ROLE_PERMISSIONS[user.role] ?? []`; the request passes if any required permission is present (`required.some(...)`).
- Fails with `UnauthorizedException` if there is no `req.user`, `ForbiddenException('Insufficient permissions')` otherwise.

## Email/password login flow

1. `POST /api/auth/register` `{ name, email, password }` → hashes the password (Node `scrypt`, `salt:hash`), creates the `User` row, and returns `{ token, user }`.
2. `POST /api/auth/login` `{ email, password }` → verifies the scrypt hash and returns `{ token, user }`.
3. The client sends the token as `Authorization: Bearer <token>`; `JwtAuthGuard` verifies it (HS256, signed with `APP_JWT_SECRET`), loads the user by `sub`, and `PermissionGuard` enforces the handler's `@Permissions(...)`.
4. `GET /api/auth/me` returns the profile + granted permissions.

Other endpoints: `POST /api/auth/logout` (stateless — client discards the token), `PATCH /api/users/:id/role` (`user:manage`).

**Hackathon-only rules** (change before a real launch):
- The **first** registered account becomes `ADMIN`; every later registration becomes `STAFF`. Assign roles afterwards via `PATCH /api/users/:id/role` (requires `user:manage`).
- JWT expiry is 7 days.
- `synchronize: true` auto-creates/updates the `users` table from the entity.

## Porting to another project

Copy the three blocks above verbatim (`Permission` union, role enum, grants map). Guard route handlers with a `RequirePermission`/`@Permissions` decorator and gate UI elements with `roleHasPermission(role, 'source:update')`. Keep the convention "add the token to `PERMISSIONS` first, then grant it in `ROLE_PERMISSIONS`" so the union and the grants stay in sync.
