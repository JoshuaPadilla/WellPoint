import { SetMetadata } from '@nestjs/common';
import type { Permission } from './permissions';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Declare the required permissions for a handler (or controller).
 * Semantics are any-match: the request passes if the caller's role grants
 * at least one of the listed permissions.
 */
export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
