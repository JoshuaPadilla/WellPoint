import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import type { AuthenticatedUser } from 'src/common/interface/authenticated-user.interface';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { GoogleOAuthGuard } from 'src/guards/google-oauth';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import type { GoogleProfile } from '../users/users.service';
import { DevLoginSchema } from 'src/schemas/domain.schema';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  googleAuth(): void {
    // Passport redirects to Google.
  }

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthRedirect(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const profile = req.user as unknown as GoogleProfile;
    const { tokens } = await this.authService.loginWithGoogle(profile);
    this.authService.setAuthCookies(res, tokens);
    const frontend =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    res.redirect(frontend);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request): AuthenticatedUser {
    return req.user as AuthenticatedUser;
  }

  @Post('logout')
  logout(@Res() res: Response): void {
    this.authService.clearAuthCookies(res);
    res.status(204).send();
  }

  @Post('dev-login')
  async devLogin(
    @Body(new ZodValidationPipe(DevLoginSchema)) body: { email: string },
    @Res() res: Response,
  ): Promise<void> {
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      throw new ForbiddenException('Dev login is disabled in production.');
    }
    const result = await this.authService.loginDemoAccount(body.email);
    if (!result) {
      throw new UnauthorizedException('Unknown demo account.');
    }
    this.authService.setAuthCookies(res, result.tokens);
    res.json({ ok: true, email: result.user.email });
  }
}
