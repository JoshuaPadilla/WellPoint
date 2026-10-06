import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Community } from '../entities/community.entity';
import { ServiceStatus } from '../entities/service-status.entity';
import { WaterSystem } from '../entities/water-system.entity';
import { Alert } from '../entities/alert.entity';
import { accessState, AccessState } from '../derive';

export type MetricsView = {
  score: number;
  statusBand: 'secure' | 'watch' | 'critical';
  coveragePct: number;
  reliabilityPct: number;
  affordability: number;
  activeAlerts: number;
  breakdown: {
    served: number;
    partial: number;
    underserved: number;
    criticalAlerts: number;
    warningAlerts: number;
    infoAlerts: number;
  };
};

@Injectable()
export class MetricsService {
  constructor(
    @InjectRepository(Community)
    private readonly communityRepo: Repository<Community>,
    @InjectRepository(ServiceStatus)
    private readonly statusRepo: Repository<ServiceStatus>,
    @InjectRepository(WaterSystem)
    private readonly systemRepo: Repository<WaterSystem>,
    @InjectRepository(Alert) private readonly alertRepo: Repository<Alert>,
  ) {}

  async compute(): Promise<MetricsView> {
    const communities = await this.communityRepo.find({
      relations: { system: true },
    });
    const systems = await this.systemRepo.find();
    const alerts = await this.alertRepo.find();

    const statuses = await this.statusRepo.find({
      order: { timestamp: 'ASC' },
    });
    const latestBySystem = new Map<string, ServiceStatus>();
    for (const s of statuses) latestBySystem.set(s.systemId, s);

    const states = new Map<string, AccessState>();
    for (const c of communities) {
      const status = c.systemId ? latestBySystem.get(c.systemId) : undefined;
      states.set(
        c.id,
        accessState(
          c.affordability,
          status
            ? {
                available: status.available,
                flow: status.flow,
                quality: status.quality,
              }
            : null,
        ),
      );
    }

    let totalPop = 0;
    let coveredPop = 0;
    let affordabilityWeighted = 0;
    const servedCount = new Map<string, number>([
      ['served', 0],
      ['partial', 0],
      ['underserved', 0],
    ]);
    for (const c of communities) {
      const state = states.get(c.id) ?? 'underserved';
      servedCount.set(state, (servedCount.get(state) ?? 0) + 1);
      totalPop += c.population;
      if (state === 'served' || state === 'partial') coveredPop += c.population;
      affordabilityWeighted += c.affordability * c.population;
    }

    let reliabilitySum = 0;
    for (const sys of systems) {
      const latest = latestBySystem.get(sys.id);
      reliabilitySum += latest ? (latest.available ? latest.flow : 0) : 0;
    }
    const reliabilityPct = systems.length ? reliabilitySum / systems.length : 0;

    const criticalAlerts = alerts.filter(
      (a) => a.status === 'active' && a.severity === 'critical',
    ).length;
    const warningAlerts = alerts.filter(
      (a) => a.status === 'active' && a.severity === 'warning',
    ).length;
    const infoAlerts = alerts.filter(
      (a) => a.status === 'active' && a.severity === 'info',
    ).length;
    const activeAlerts = criticalAlerts + warningAlerts + infoAlerts;

    const coveragePct = totalPop ? (coveredPop / totalPop) * 100 : 0;
    const affordability = totalPop ? affordabilityWeighted / totalPop : 0;

    const penalty = Math.min(
      30,
      10 * criticalAlerts + 4 * warningAlerts + 1 * infoAlerts,
    );
    const score = Math.max(
      0,
      Math.min(
        100,
        0.4 * coveragePct +
          0.3 * reliabilityPct +
          0.3 * affordability -
          penalty,
      ),
    );
    const statusBand: MetricsView['statusBand'] =
      score >= 75 ? 'secure' : score >= 50 ? 'watch' : 'critical';

    return {
      score: Math.round(score),
      statusBand,
      coveragePct: Math.round(coveragePct),
      reliabilityPct: Math.round(reliabilityPct),
      affordability: Math.round(affordability),
      activeAlerts,
      breakdown: {
        served: servedCount.get('served') ?? 0,
        partial: servedCount.get('partial') ?? 0,
        underserved: servedCount.get('underserved') ?? 0,
        criticalAlerts,
        warningAlerts,
        infoAlerts,
      },
    };
  }
}
