import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export type AuthPayload = { sub: number; email: string };

// Checks the "Authorization: Bearer <token>" header and puts the payload on request.user.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const [scheme, token] = String(request.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException('Please log in.');
    try {
      request.user = await this.jwtService.verifyAsync<AuthPayload>(token);
      return true;
    } catch {
      throw new UnauthorizedException('Your session has expired. Please log in again.');
    }
  }
}
