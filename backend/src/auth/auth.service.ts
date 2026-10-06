import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './auth.dto';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (v: unknown) => String(v ?? '').trim();

export type PublicUser = {
  id: number;
  name: string;
  email: string;
  barangay: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(body: RegisterDto) {
    const name = text(body?.name);
    const email = text(body?.email).toLowerCase();
    const password = String(body?.password ?? '');
    const barangay = text(body?.barangay);

    // Same rules as the frontend's validateRegister.
    const errors: Record<string, string> = {};
    if (!name) errors.name = 'Enter your full name.';
    if (!barangay) errors.barangay = 'Enter your barangay.';
    if (!EMAIL.test(email)) errors.email = 'Enter a valid email address.';
    if (password.length < 8) errors.password = 'Use at least 8 characters.';
    if (Object.keys(errors).length) {
      throw new BadRequestException({ message: 'Please fix the highlighted fields.', errors });
    }

    if (await this.usersService.findByEmailWithPassword(email)) {
      throw new ConflictException({
        message: 'An account with this email already exists.',
        errors: { email: 'An account with this email already exists.' },
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.usersService.create({ name, email, passwordHash, barangay });
    return this.session(user);
  }

  async login(body: LoginDto) {
    const email = text(body?.email).toLowerCase();
    const password = String(body?.password ?? '');
    if (!email || !password) {
      throw new BadRequestException('Enter your email and password.');
    }

    const user = await this.usersService.findByEmailWithPassword(email);
    const ok = user && (await bcrypt.compare(password, user.passwordHash));
    if (!user || !ok) throw new UnauthorizedException('Incorrect email or password.');
    return this.session(user);
  }

  async me(userId: number): Promise<PublicUser> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Account no longer exists.');
    return this.toPublic(user);
  }

  private async session(user: User) {
    const accessToken = await this.jwtService.signAsync({ sub: user.id, email: user.email });
    return { accessToken, user: this.toPublic(user) };
  }

  private toPublic(user: User): PublicUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      barangay: user.barangay,
    };
  }
}
