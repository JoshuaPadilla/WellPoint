import { UserRoles } from '../enum/user_roles.enum';
import type { Permission } from './permissions';

export const ROLE_PERMISSIONS: Record<UserRoles, readonly Permission[]> = {
  [UserRoles.WATER_OFFICER]: [
    'dashboard:read',
    'barangay:read',
    'vulnerability:read',
    'alert:read',
    'source:read',
    'report:read',
    'report:ack',
    'report:resolve',
    'demo:simulate',
    'demo:reset',
  ],
  [UserRoles.DRRM_OFFICER]: [
    'dashboard:read',
    'barangay:read',
    'vulnerability:read',
    'alert:read',
    'source:read',
    'demo:simulate',
    'demo:reset',
  ],
  [UserRoles.BARANGAY_OFFICIAL]: [
    'barangay:read:own',
    'vulnerability:read:own',
    'alert:read:own',
    'source:read:own',
    'report:read:own',
    'report:create',
  ],
  [UserRoles.RESIDENT]: ['status:read:public'],
  [UserRoles.BARANGAY_ADMIN]: [
    'barangay:read:own',
    'vulnerability:read:own',
    'alert:read:own',
    'source:read:own',
    'report:read:own',
    'report:create',
  ],
};

export function roleHasPermission(
  role: UserRoles | undefined,
  permission: Permission,
): boolean {
  if (!role) {
    return false;
  }
  const grants = ROLE_PERMISSIONS[role];
  return grants ? grants.includes(permission) : false;
}

export function permissionsForRole(
  role: UserRoles | undefined,
): readonly Permission[] {
  if (!role) {
    return [];
  }
  return ROLE_PERMISSIONS[role] ?? [];
}
