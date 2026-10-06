import type { UserRoles } from '../enum/user_roles.enum';
import type { Permission } from '../rbac/permissions';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRoles;
  lguId: string;
  barangayId: string | null;
  permissions: readonly Permission[];
}

export type RequestUser = AuthenticatedUser;
