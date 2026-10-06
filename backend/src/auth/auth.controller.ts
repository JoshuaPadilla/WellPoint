import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { UserRoles } from '../common/enum/user_roles.enum';
import { ROLE_PERMISSIONS } from '../common/rbac/role_permissions';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  /** Returns the Supabase/Google authorize URL; the frontend redirects to it. */
  @Get('google')
  google() {
    return { url: this.authService.getGoogleAuthUrl() };
  }

  /** Supabase redirects here after Google consent. Exchange the PKCE code,
   *  upsert the app user, then bounce to the frontend with session tokens. */
  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!code || !state) throw new BadRequestException('Missing code or state');

    const session = await this.authService.exchangeCode(code, state);
    const supabaseUser = await this.authService.getUser(session.access_token);

    let user = await this.usersService.findById(supabaseUser.id);
    if (!user) {
      // Hackathon-only: the first Google sign-in becomes admin, the rest staff.
      const isFirst = (await this.usersService.count()) === 0;
      user = await this.usersService.create({
        id: supabaseUser.id,
        email: supabaseUser.email ?? '',
        name: String(
          supabaseUser.user_metadata?.full_name ??
            supabaseUser.user_metadata?.name ??
            supabaseUser.email,
        ),
        role: isFirst ? UserRoles.ADMIN : UserRoles.STAFF,
      });
    }

    const frontendUrl =
      this.configService.getOrThrow<string>('auth.frontendUrl');
    const url =
      `${frontendUrl}/auth/callback?token=${encodeURIComponent(session.access_token)}` +
      `&refresh_token=${encodeURIComponent(session.refresh_token)}`;

    res.redirect(url);
  }

  /** Current profile + the permissions granted to the signed-in role. */
  @Get('me')
  me(
    @Req()
    req: {
      user?: { id: string; email: string; name: string | null; role: string };
    },
  ) {
    const user = req.user;
    if (!user) throw new UnauthorizedException();
    return {
      ...user,
      permissions: ROLE_PERMISSIONS[user.role as UserRoles] ?? [],
    };
  }

  @Post('refresh')
  async refresh(@Body() body: { refresh_token?: string }) {
    if (!body.refresh_token)
      throw new BadRequestException('Missing refresh_token');
    const session = await this.authService.refresh(body.refresh_token);
    return {
      token: session.access_token,
      refresh_token: session.refresh_token,
    };
  }

  @Post('logout')
  async logout(@Body() body: { token?: string }) {
    if (body.token) {
      await this.authService.logout(body.token).catch(() => undefined);
    }
    return { ok: true };
  }
}
