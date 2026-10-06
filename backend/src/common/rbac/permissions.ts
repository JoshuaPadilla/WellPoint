/**
 * Every atomic capability in the system. Add here first, then grant it in
 * `ROLE_PERMISSIONS`. Re-scoped for the WellPoint water app (hackathon) from
 * the loan-domain tokens described in docs/permission_guide.md.
 */
export const PERMISSIONS = [
  'dashboard:read',

  'source:read',
  'source:create',
  'source:update',
  'source:delete',

  'alert:read',
  'report:read',
  'delivery:read',

  'user:manage', // create users, change roles
  'auditlog:read',
] as const;

export type Permission = (typeof PERMISSIONS)[number];
