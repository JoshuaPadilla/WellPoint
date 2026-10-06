import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { UsersService } from '../../modules/users/users.service';
import { verifyHs256 } from './jwt.util';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

/**
 * Permissive auth guard: attaches `req.user` when a valid Bearer token is
 * present, leaves it undefined otherwise. Enforced downstream by
 * `PermissionGuard` / handlers that need a profile.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers['authorization'];

    if (!header) return true;

    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    const secret = this.configService.getOrThrow<string>('auth.jwtSecret');
    const claims = verifyHs256(token, secret);
    if (!claims?.sub) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.usersService.findById(claims.sub);
    if (!user) {
      throw new UnauthorizedException('Account not found');
    }

    request.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return true;
  }
}
