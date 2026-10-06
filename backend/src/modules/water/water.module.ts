import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedModule } from '../../db/seed/seed.module';
import { Community } from '../../entities/community.entity';
import { CommunityReport } from '../../entities/community-report.entity';
import { ServiceStatus } from '../../entities/service-status.entity';
import { WaterSource } from '../../entities/water-source.entity';
import { WaterSystem } from '../../entities/water-system.entity';
import { AlertsController } from './controllers/alerts.controller';
import { BarangaysController } from './controllers/barangays.controller';
import { DemoController } from './controllers/demo.controller';
import { MetricsController } from './controllers/metrics.controller';
import { ReportsController } from './controllers/reports.controller';
import { SourcesController } from './controllers/sources.controller';
import { StatusController } from './controllers/status.controller';
import { AlertsService } from './services/alerts.service';
import { DemoService } from './services/demo.service';
import { MetricsService } from './services/metrics.service';
import { ReadModelsService } from './services/read-models.service';
import { ReportsService } from './services/reports.service';
import { VulnerabilityService } from './services/vulnerability.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Community,
      WaterSystem,
      WaterSource,
      ServiceStatus,
      CommunityReport,
    ]),
    SeedModule,
  ],
  controllers: [
    MetricsController,
    StatusController,
    AlertsController,
    SourcesController,
    BarangaysController,
    ReportsController,
    DemoController,
  ],
  providers: [
    VulnerabilityService,
    AlertsService,
    MetricsService,
    ReadModelsService,
    ReportsService,
    DemoService,
  ],
  exports: [AlertsService],
})
export class WaterModule {}
