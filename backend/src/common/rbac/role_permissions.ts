import { UserRoles } from '../enum/user_roles.enum';
import { PERMISSIONS } from './permissions';
import type { Permission } from './permissions';

export const ROLE_PERMISSIONS: Record<UserRoles, readonly Permission[]> = {
  admin: [...PERMISSIONS], // all

  manager: [
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

  staff: [
    'dashboard:read',
    'source:read',
    'source:create',
    'source:update',
    'alert:read',
    'delivery:read',
  ],

  viewer: ['dashboard:read', 'source:read', 'alert:read', 'delivery:read'],

  pending: [], // zero grants until an admin/manager assigns a real role
};
