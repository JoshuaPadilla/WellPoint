import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRoles } from '../../common/enum/user_roles.enum';
import { ROLE_PERMISSIONS } from '../../common/rbac/role_permissions';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body()
    body: {
      name?: string;
      brgy?: string;
      email?: string;
      password?: string;
    },
  ) {
    const name = body.name?.trim() ?? '';
    const brgy = body.brgy?.trim() ?? '';
    const email = (body.email ?? '').trim().toLowerCase();
    const password = body.password ?? '';

    if (!name) throw new BadRequestException('Name is required');
    if (!brgy) throw new BadRequestException('Barangay is required');
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      throw new BadRequestException('A valid email is required');
    }
    if (password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    return this.authService.register(name, brgy, email, password);
  }

  @Post('login')
  async login(@Body() body: { email?: string; password?: string }) {
    const email = (body.email ?? '').trim().toLowerCase();
    const password = body.password ?? '';
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }
    return this.authService.login(email, password);
  }

  /** Current profile + the permissions granted to the signed-in role. */
  @Get('me')
  me(
    @Req()
    req: {
      user?: {
        id: string;
        email: string;
        name: string | null;
        brgy: string | null;
        role: string;
      };
    },
  ) {
    const user = req.user;
    if (!user) throw new UnauthorizedException();
    return {
      ...user,
      permissions: ROLE_PERMISSIONS[user.role as UserRoles] ?? [],
    };
  }

  /** Stateless JWT: the client just discards the token. */
  @Post('logout')
  logout() {
    return { ok: true };
  }
}
