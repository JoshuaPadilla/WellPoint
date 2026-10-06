import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRoles } from '../enum/user_roles.enum';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { ROLE_PERMISSIONS } from './role_permissions';
import type { Permission } from './permissions';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required =
      this.reflector.getAllAndOverride<readonly Permission[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    // No declared permissions → allow (authenticated-only baseline).
    if (required.length === 0) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException();
    }

    const granted = new Set(ROLE_PERMISSIONS[user.role as UserRoles] ?? []);
    if (!required.some((permission) => granted.has(permission))) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
