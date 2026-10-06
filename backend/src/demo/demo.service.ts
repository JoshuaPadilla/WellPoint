import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ServiceStatus } from '../entities/service-status.entity';
import { WaterSystem } from '../entities/water-system.entity';
import { SimulateDto } from '../common/schemas';
import { AlertsService } from '../alerts/alerts.service';
import { SeederService } from '../db/seed/seeder.service';

@Injectable()
export class DemoService {
  private readonly logger = new Logger(DemoService.name);

  constructor(
    @InjectRepository(ServiceStatus)
    private readonly statusRepo: Repository<ServiceStatus>,
    @InjectRepository(WaterSystem)
    private readonly systemRepo: Repository<WaterSystem>,
    private readonly dataSource: DataSource,
    private readonly alerts: AlertsService,
    private readonly seeder: SeederService,
  ) {}

  async simulate(dto: SimulateDto): Promise<void> {
    const system = await this.systemRepo.findOne({
      where: { id: dto.targetSystemId },
    });
    if (!system)
      throw new NotFoundException(`System ${dto.targetSystemId} not found`);

    const now = Date.now();
    const samples: Omit<ServiceStatus, 'id'>[] = [];

    const push = (
      hoursAgo: number,
      available: boolean,
      flow: number,
      quality: ServiceStatus['quality'],
      reason?: ServiceStatus['reason'],
    ) => {
      samples.push({
        systemId: system.id,
        timestamp: new Date(now - hoursAgo * 3600e3),
        available,
        flow,
        quality,
        reason: reason ?? null,
      });
    };

    switch (dto.type) {
      case 'typhoon':
        push(6, true, 42, 'advisory');
        push(3, true, 20, 'advisory', 'typhoon');
        push(0, false, 0, 'unsafe', 'typhoon');
        break;
      case 'drought':
        push(6, true, 42, 'safe', 'drought');
        push(3, true, 28, 'advisory', 'drought');
        push(0, true, 14, 'advisory', 'drought');
        break;
      case 'contamination':
        push(6, true, 48, 'safe');
        push(3, true, 32, 'advisory', 'contamination');
        push(0, true, 22, 'unsafe', 'contamination');
        break;
      case 'maintenance':
        push(6, true, 55, 'safe');
        push(3, true, 40, 'advisory', 'maintenance');
        push(0, true, 30, 'advisory', 'maintenance');
        break;
    }

    await this.statusRepo.save(samples);
    await this.alerts.derive();
    this.logger.log(`Simulated ${dto.type} on ${system.name}.`);
  }

  async reset(): Promise<void> {
    await this.dataSource.transaction(async (em) => {
      await em.query(
        `TRUNCATE "community_report", "alert", "service_status", "water_source", "community", "water_system" CASCADE`,
      );
    });
    await this.seeder.seed();
    await this.alerts.derive();
    this.logger.log('Demo reset to known-good state.');
  }
}
