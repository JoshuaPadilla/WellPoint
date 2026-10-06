import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { signHs256 } from '../../common/auth/jwt.util';
import { hashPassword, verifyPassword } from '../../common/auth/password.util';
import { UserRoles } from '../../common/enum/user_roles.enum';
import { User } from '../users/entity/user.entity';
import { UsersService } from '../users/users.service';

export interface Session {
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    brgy: string | null;
    role: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  private jwtSecret(): string {
    return this.configService.getOrThrow<string>('auth.jwtSecret');
  }

  private issueToken(user: Session['user']): string {
    const now = Math.floor(Date.now() / 1000);
    return signHs256(
      {
        sub: user.id,
        role: user.role,
        email: user.email,
        name: user.name ?? undefined,
        exp: now + 7 * 24 * 60 * 60, // 7 days — hackathon friendly
      },
      this.jwtSecret(),
    );
  }

  private toSession(user: {
    id: string;
    email: string;
    name?: string | null;
    brgy?: string | null;
    role: UserRoles;
  }): Session {
    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      brgy: user.brgy ?? null,
      role: user.role,
    };
    return { token: this.issueToken(sessionUser), user: sessionUser };
  }

  async register(
    name: string,
    brgy: string,
    email: string,
    password: string,
  ): Promise<Session> {
    const existing = await this.usersService.findByEmail(email);
    if (existing) throw new ConflictException('Email is already registered');

    // Hackathon-only: the first account becomes admin, the rest staff.
    const isFirst = (await this.usersService.count()) === 0;
    const user: User = await this.usersService.create({
      id: randomUUID(),
      email,
      name,
      brgy,
      password: hashPassword(password),
      role: isFirst ? UserRoles.ADMIN : UserRoles.STAFF,
    });

    return this.toSession(user);
  }

  async login(email: string, password: string): Promise<Session> {
    const user = await this.usersService.findByEmailWithPassword(email);

    if (!user?.password || !verifyPassword(password, user.password)) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.toSession(user);
  }
}
