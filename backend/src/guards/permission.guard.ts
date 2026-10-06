import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedUser } from 'src/common/interface/authenticated-user.interface';
import { PERMISSIONS_KEY } from 'src/common/rbac/permissions.decorator';
import type { Permission } from 'src/common/rbac/permissions';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
    }>();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const granted = new Set<Permission>(user.permissions ?? []);
    if (required.some((permission) => granted.has(permission))) {
      return true;
    }

    throw new ForbiddenException('Insufficient permissions');
  }
}
