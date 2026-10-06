import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExternalIdentity } from './entity/external-identity.entity';
import { Membership } from './entity/membership.entity';
import { User } from './entity/user.entity';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, ExternalIdentity, Membership])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
