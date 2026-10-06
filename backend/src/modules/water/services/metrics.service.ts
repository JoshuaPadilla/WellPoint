import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Community } from '../../../entities/community.entity';
import { ServiceStatus } from '../../../entities/service-status.entity';
import { WaterSystem } from '../../../entities/water-system.entity';
import { Repository } from 'typeorm';
import { deriveAccessState, deriveStatusBand } from './derive';
import { AlertsService, type AlertRecord } from './alerts.service';

export interface MetricsResult {
  accessCoverage: number;
  reliability: number;
  affordability: number;
  activeAlerts: number;
  score: number;
  band: 'secure' | 'watch' | 'critical';
}

@Injectable()
export class MetricsService {
  constructor(
    @InjectRepository(Community)
    private readonly communityRepo: Repository<Community>,
    @InjectRepository(WaterSystem)
    private readonly systemRepo: Repository<WaterSystem>,
    @InjectRepository(ServiceStatus)
    private readonly statusRepo: Repository<ServiceStatus>,
    private readonly alertsService: AlertsService,
  ) {}

  async derive(): Promise<MetricsResult> {
    const [communities, systems, statuses, alerts] = await Promise.all([
      this.communityRepo.find(),
      this.systemRepo.find(),
      this.statusRepo.find({ order: { timestamp: 'ASC' } }),
      this.alertsService.deriveAll(),
    ]);

    const latestBySystem = new Map<string, ServiceStatus>();
    for (const status of statuses) {
      latestBySystem.set(status.systemId, status);
    }

    let totalPopulation = 0;
    let accessedPopulation = 0;
    let affordabilityWeighted = 0;

    for (const community of communities) {
      totalPopulation += community.population;
      affordabilityWeighted += community.population * community.affordability;

      const status = community.systemId
        ? latestBySystem.get(community.systemId)
        : undefined;
      const accessState = deriveAccessState(
        status
          ? {
              available: status.available,
              flow: status.flow,
              quality: status.quality,
              reason: status.reason,
            }
          : null,
        community.affordability,
      );
      if (accessState === 'served' || accessState === 'partial') {
        accessedPopulation += community.population;
      }
    }

    const accessCoverage =
      totalPopulation > 0
        ? Number(((accessedPopulation / totalPopulation) * 100).toFixed(1))
        : 0;

    const reliability = this.computeReliability(systems, latestBySystem);
    const affordability =
      totalPopulation > 0
        ? Number((affordabilityWeighted / totalPopulation).toFixed(1))
        : 0;

    const activeAlerts = alerts.filter((a) => a.status === 'active').length;
    const penalty = this.computePenalty(alerts);

    const rawScore =
      0.4 * accessCoverage + 0.3 * reliability + 0.3 * affordability - penalty;
    const score = Math.max(0, Math.min(100, Math.round(rawScore)));

    return {
      accessCoverage,
      reliability,
      affordability,
      activeAlerts,
      score,
      band: deriveStatusBand(score),
    };
  }

  private computeReliability(
    systems: WaterSystem[],
    latestBySystem: Map<string, ServiceStatus>,
  ): number {
    if (systems.length === 0) {
      return 0;
    }
    const total = systems.reduce((sum, system) => {
      const status = latestBySystem.get(system.id);
      const flow = status?.available === false ? 0 : (status?.flow ?? 0);
      return sum + flow;
    }, 0);
    return Number((total / systems.length).toFixed(1));
  }

  private computePenalty(alerts: AlertRecord[]): number {
    let critical = 0;
    let warning = 0;
    let info = 0;
    for (const alert of alerts) {
      if (alert.status !== 'active') {
        continue;
      }
      if (alert.severity === 'critical') {
        critical += 1;
      } else if (alert.severity === 'warning') {
        warning += 1;
      } else {
        info += 1;
      }
    }
    return Math.min(30, 10 * critical + 4 * warning + 1 * info);
  }
}
