import { UserRoles } from '../enum/user_roles.enum';
import type { Permission } from './permissions';
import { PERMISSIONS } from './permissions';

export const ROLE_PERMISSIONS: Record<UserRoles, readonly Permission[]> = {
  admin: [...PERMISSIONS], // all
  lgu: [...PERMISSIONS], // all

  water_officer: [
    'dashboard:read',
    'source:read',
    'source:create',
    'source:update',
    'alert:read',
    'report:read',
    'delivery:read',
    'user:manage',
    'auditlog:read',
  ],

  drrm: [
    'dashboard:read',
    'source:read',
    'source:create',
    'source:update',
    'alert:read',
    'delivery:read',
  ],

  user: ['dashboard:read', 'source:read', 'alert:read', 'delivery:read'],
};
