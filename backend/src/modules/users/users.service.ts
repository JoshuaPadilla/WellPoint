import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DEFAULT_LGU_ID } from '../../common/constants';
import type { AuthenticatedUser } from '../../common/interface/authenticated-user.interface';
import { permissionsForRole } from '../../common/rbac/role_permissions';
import { UserRoles } from '../../common/enum/user_roles.enum';
import { ExternalIdentity } from './entity/external-identity.entity';
import { Membership } from './entity/membership.entity';
import { User } from './entity/user.entity';

export interface GoogleProfile {
  googleSub: string;
  email: string;
  givenName: string;
  familyName: string;
  profileUrl?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ExternalIdentity)
    private readonly identityRepo: Repository<ExternalIdentity>,
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
  ) {}

  async findOrCreateFromGoogle(profile: GoogleProfile): Promise<User> {
    let identity = await this.identityRepo.findOne({
      where: { provider: 'google', subject: profile.googleSub },
    });
    if (identity) {
      const user = await this.userRepo.findOne({
        where: { id: identity.userId },
      });
      if (user) {
        return user;
      }
    }

    let user = await this.userRepo.findOne({
      where: { email: profile.email },
    });

    if (!user) {
      user = this.userRepo.create({
        email: profile.email,
        name: `${profile.givenName} ${profile.familyName}`.trim(),
        state: 'active',
      });
      user = await this.userRepo.save(user);
    }

    if (!identity) {
      identity = this.identityRepo.create({
        userId: user.id,
        provider: 'google',
        subject: profile.googleSub,
      });
      await this.identityRepo.save(identity);
    }

    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findAuthenticatedUser(id: string): Promise<AuthenticatedUser | null> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user || user.state !== 'active') {
      return null;
    }

    const memberships = await this.membershipRepo.find({
      where: { userId: id, active: true },
      order: { createdAt: 'ASC' },
    });

    const membership = memberships[0];
    if (!membership) {
      return null;
    }

    const role = membership.role as UserRoles;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role,
      lguId: membership.lguId || DEFAULT_LGU_ID,
      barangayId: membership.barangayPsgc,
      permissions: permissionsForRole(role),
    };
  }
}
