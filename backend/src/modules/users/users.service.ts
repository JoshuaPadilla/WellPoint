import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRoles } from '../../common/enum/user_roles.enum';
import { User } from './entity/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.usersRepo.findOneBy({ id });
  }

  findByIdWithBrgy(id: string): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.brgy')
      .where('user.id = :id', { id })
      .getOne();
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOneBy({ email });
  }

  /** Includes the hidden `password` column. */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .addSelect('user.brgy')
      .where('user.email = :email', { email })
      .getOne();
  }

  findAll(): Promise<User[]> {
    return this.usersRepo.find({ order: { createdAt: 'ASC' } });
  }

  count(): Promise<number> {
    return this.usersRepo.count();
  }

  create(data: {
    id: string;
    email: string;
    name?: string;
    brgy?: string;
    password?: string;
    role: UserRoles;
  }): Promise<User> {
    return this.usersRepo.save(
      this.usersRepo.create({
        id: data.id,
        email: data.email,
        name: data.name,
        brgy: data.brgy,
        password: data.password ?? null,
        role: data.role,
      }),
    );
  }

  async updateRole(id: string, role: UserRoles): Promise<User | null> {
    const user = await this.usersRepo.findOneBy({ id });
    if (!user) return null;
    user.role = role;
    return this.usersRepo.save(user);
  }
}
