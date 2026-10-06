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

Authentication is Google OAuth through Supabase, proxied by the NestJS backend (see [Google login flow](#google-login-flow)). The bearer token is the Supabase session access token; `JwtAuthGuard` verifies its HS256 signature against `SUPABASE_JWT_SECRET`, loads the app `User` row by `sub` (the Supabase auth user id), and attaches `req.user = { id, email, name, role }`.

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
  PENDING = "pending", // signed in via Google, no access until a role is granted
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

## Google login flow

All Supabase calls happen on the backend; the frontend never talks to Supabase directly.

1. `GET /api/auth/google` → `AuthService` builds the Supabase authorize URL with **PKCE** (`code_challenge_method=S256`): it generates a `code_verifier` (held server-side in an in-memory map keyed by a random `state`) and returns the URL.
2. Frontend redirects to that URL → Google → Supabase redirects to `GET /api/auth/google/callback?code=...&state=...`.
3. Backend exchanges `code` + the stored `code_verifier` against `{SUPABASE_URL}/auth/v1/token?grant_type=pkce`, fetches the full profile with `supabase.auth.getUser(access_token)`, upserts the app `User` row, then redirects to `{FRONTEND_URL}/auth/callback?token=<access_token>&refresh_token=<refresh_token>`.
4. Frontend stores the tokens and calls `GET /api/auth/me` for the profile + granted permissions.

Other endpoints: `POST /api/auth/refresh` (refresh token), `POST /api/auth/logout`, `PATCH /api/users/:id/role` (`user:manage`).

**Hackathon-only rules** (change before a real launch):
- The configured Supabase value may be the raw **JWT secret** rather than a real service-role key; `AuthService.adminKey()` mints a short-lived `service_role` HS256 token from it if the configured key is not an `eyJ…` JWT. Put a real service-role key in `SUPABASE_SERVICE_ROLE_KEY` for production.
- The **first** Google sign-in becomes `ADMIN`; every later sign-in becomes `STAFF`. Assign roles afterwards via `PATCH /api/users/:id/role` (requires `user:manage`).
- `synchronize: true` auto-creates the `users` table from the entity.

## Porting to another project

Copy the three blocks above verbatim (`Permission` union, role enum, grants map). Guard route handlers with a `RequirePermission`/`@Permissions` decorator and gate UI elements with `roleHasPermission(role, 'source:update')`. Keep the convention "add the token to `PERMISSIONS` first, then grant it in `ROLE_PERMISSIONS`" so the union and the grants stay in sync.
