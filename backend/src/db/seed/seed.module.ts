import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Community } from '../../entities/community.entity';
import { CommunityReport } from '../../entities/community-report.entity';
import { ServiceStatus } from '../../entities/service-status.entity';
import { WaterSource } from '../../entities/water-source.entity';
import { WaterSystem } from '../../entities/water-system.entity';
import { ExternalIdentity } from '../../modules/users/entity/external-identity.entity';
import { Membership } from '../../modules/users/entity/membership.entity';
import { User } from '../../modules/users/entity/user.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Community,
      WaterSystem,
      WaterSource,
      ServiceStatus,
      CommunityReport,
      User,
      ExternalIdentity,
      Membership,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
