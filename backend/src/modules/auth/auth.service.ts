import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { Response } from 'express';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from 'src/common/constants';
import type { AuthTokens } from 'src/common/interface/auth-tokens.interface';
import { UsersService } from 'src/modules/users/users.service';
import type { GoogleProfile } from 'src/modules/users/users.service';
import type { User } from 'src/modules/users/entity/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async generateTokens(userId: string): Promise<AuthTokens> {
    const payload = { sub: userId };
    const accessExpiresIn = (this.configService.get<string>(
      'jwt.accessExpiresIn',
    ) ?? '15m') as JwtSignOptions['expiresIn'];
    const refreshExpiresIn = (this.configService.get<string>(
      'jwt.refreshExpiresIn',
    ) ?? '7d') as JwtSignOptions['expiresIn'];

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: refreshExpiresIn,
      }),
    ]);
    return { accessToken, refreshToken };
  }

  async loginWithGoogle(
    profile: GoogleProfile,
  ): Promise<{ user: User; tokens: AuthTokens }> {
    const user = await this.usersService.findOrCreateFromGoogle(profile);
    const tokens = await this.generateTokens(user.id);
    return { user, tokens };
  }

  async loginDemoAccount(
    email: string,
  ): Promise<{ user: User; tokens: AuthTokens } | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }
    const tokens = await this.generateTokens(user.id);
    return { user, tokens };
  }

  setAuthCookies(res: Response, tokens: AuthTokens): void {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
    };

    res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  clearAuthCookies(res: Response): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
  }
}
