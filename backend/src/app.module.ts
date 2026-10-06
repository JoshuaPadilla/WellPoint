import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Community } from './entities/community.entity';
import { WaterSystem } from './entities/water-system.entity';
import { WaterSource } from './entities/water-source.entity';
import { ServiceStatus } from './entities/service-status.entity';
import { CommunityReport } from './entities/community-report.entity';
import { Alert } from './entities/alert.entity';
import { SeederService } from './db/seed/seeder.service';
import { VulnerabilityService } from './vulnerability/vulnerability.service';
import { AlertsService } from './alerts/alerts.service';
import { AlertsController } from './alerts/alerts.controller';
import { MetricsService } from './metrics/metrics.service';
import { MetricsController } from './metrics/metrics.controller';
import { BarangaysService } from './barangays/barangays.service';
import { BarangaysController } from './barangays/barangays.controller';
import { SourcesController } from './sources/sources.controller';
import { ReportsService } from './reports/reports.service';
import { ReportsController } from './reports/reports.controller';
import { DemoService } from './demo/demo.service';
import { DemoController } from './demo/demo.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5433),
        username: config.get('DB_USERNAME', 'wellpoint'),
        password: config.get('DB_PASSWORD', 'wellpoint'),
        database: config.get('DB_NAME', 'wellpoint'),
        autoLoadEntities: true,
        synchronize: config.get('DB_SYNCHRONIZE', 'true') === 'true',
        retryAttempts: 10,
        retryDelay: 2000,
      }),
    }),
    TypeOrmModule.forFeature([
      Community,
      WaterSystem,
      WaterSource,
      ServiceStatus,
      CommunityReport,
      Alert,
    ]),
  ],
  controllers: [
    AppController,
    MetricsController,
    BarangaysController,
    AlertsController,
    SourcesController,
    ReportsController,
    DemoController,
  ],
  providers: [
    AppService,
    SeederService,
    VulnerabilityService,
    AlertsService,
    MetricsService,
    BarangaysService,
    ReportsService,
    DemoService,
  ],
})
export class AppModule {}
