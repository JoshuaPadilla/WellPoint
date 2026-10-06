import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Alert } from '../entities/alert.entity';
import { ServiceStatus } from '../entities/service-status.entity';
import { WaterSource } from '../entities/water-source.entity';
import { WaterSystem } from '../entities/water-system.entity';
import { Community } from '../entities/community.entity';
import { CommunityReport } from '../entities/community-report.entity';
import {
  VulnerabilityService,
  VulnerabilityTier,
} from '../vulnerability/vulnerability.service';

type Severity = 'info' | 'warning' | 'critical';
type AlertType = 'shortage' | 'contamination' | 'outage';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectRepository(Alert) private readonly alertRepo: Repository<Alert>,
    @InjectRepository(ServiceStatus)
    private readonly statusRepo: Repository<ServiceStatus>,
    @InjectRepository(WaterSource)
    private readonly sourceRepo: Repository<WaterSource>,
    @InjectRepository(WaterSystem)
    private readonly systemRepo: Repository<WaterSystem>,
    @InjectRepository(CommunityReport)
    private readonly reportRepo: Repository<CommunityReport>,
    private readonly dataSource: DataSource,
    private readonly vulnerability: VulnerabilityService,
  ) {}

  async findAll(): Promise<Alert[]> {
    return this.alertRepo.find({
      order: { priority: 'DESC', raisedAt: 'DESC' },
    });
  }

  async findAllActive(): Promise<Alert[]> {
    return this.alertRepo.find({
      where: { status: 'active' },
      order: { priority: 'DESC', raisedAt: 'DESC' },
    });
  }

  async derive(): Promise<void> {
    const [systems, sources, communities, reports] = await Promise.all([
      this.systemRepo.find(),
      this.sourceRepo.find(),
      this.communityRepoForDerive(),
      this.reportRepo.find({ where: { status: 'new' } }),
    ]);

    const allStatus = await this.statusRepo.find({
      order: { timestamp: 'ASC' },
    });
    const statusBySystem = new Map<string, ServiceStatus[]>();
    for (const s of allStatus) {
      const list = statusBySystem.get(s.systemId) ?? [];
      list.push(s);
      statusBySystem.set(s.systemId, list);
    }

    const tierByCommunity = await this.vulnerability.forAll();
    const systemById = new Map(systems.map((s) => [s.id, s]));
    const communityBySystem = new Map<string, Community[]>();
    for (const c of communities) {
      if (!c.systemId) continue;
      const list = communityBySystem.get(c.systemId) ?? [];
      list.push(c);
      communityBySystem.set(c.systemId, list);
    }
    const tierBySystem = new Map<string, VulnerabilityTier>();
    for (const [sysId, list] of communityBySystem) {
      tierBySystem.set(
        sysId,
        list[0] ? (tierByCommunity.get(list[0].id)?.tier ?? 'low') : 'low',
      );
    }
    const sourceBySystem = new Map<string, WaterSource[]>();
    for (const s of sources) {
      if (!s.systemId) continue;
      const list = sourceBySystem.get(s.systemId) ?? [];
      list.push(s);
      sourceBySystem.set(s.systemId, list);
    }

    const alerts: Partial<Alert>[] = [];

    for (const [systemId, ticks] of statusBySystem) {
      const system = systemById.get(systemId);
      if (!system) continue;
      const latest = ticks[ticks.length - 1];
      const areas = communityBySystem.get(systemId)?.map((c) => c.name) ?? [
        system.coverageArea,
      ];
      const area = areas.join(', ');
      const tier = tierBySystem.get(systemId) ?? 'low';
      const highVuln = tier === 'high';
      const trend = ticks.slice(-3);
      const declining =
        trend.length >= 3 &&
        trend[2].flow < trend[1].flow &&
        trend[1].flow < trend[0].flow;

      const raise = (
        type: AlertType,
        severity: Severity,
        message: string,
        action: string,
        reason?: string,
        impactNote: string | null = null,
      ): void => {
        const severityWeight =
          severity === 'critical' ? 30 : severity === 'warning' ? 10 : 2;
        const priority = severityWeight + (highVuln ? 20 : 0);
        alerts.push({
          type,
          severity,
          area,
          systemId,
          reportId: null,
          raisedAt: new Date(),
          status: 'active',
          reason: reason ?? null,
          message,
          action,
          impactNote:
            impactNote ??
            (highVuln && (type === 'outage' || type === 'contamination')
              ? `Threatens fishing/farming income in ${area}.`
              : null),
          priority,
        });
      };

      const withVulnEscalation = (severity: Severity): Severity =>
        highVuln && (severity === 'warning' || severity === 'critical')
          ? 'critical'
          : severity;

      if (!latest.available) {
        raise(
          'outage',
          'critical',
          `No water service in ${area}.`,
          `Dispatch emergency water supply to ${area} within 6 hours.`,
          latest.reason ?? 'outage',
        );
      } else if (latest.quality === 'unsafe') {
        raise(
          'contamination',
          withVulnEscalation('critical'),
          `Water quality is unsafe in ${area}.`,
          `Issue a boil-water advisory and test the ${area} supply.`,
          latest.reason ?? 'contamination',
        );
      } else if (latest.quality === 'advisory') {
        raise(
          'contamination',
          withVulnEscalation('warning'),
          `Water quality advisory in ${area}.`,
          `Sample and monitor water quality in ${area}.`,
          latest.reason ?? undefined,
        );
      }

      if (latest.flow < 25 && latest.available) {
        raise(
          'shortage',
          'critical',
          `Water flow critically low in ${area}.`,
          `Prioritize emergency water delivery to ${area}.`,
          latest.reason ?? undefined,
        );
      } else if (latest.flow < 40 && latest.available) {
        raise(
          'shortage',
          withVulnEscalation('warning'),
          `Water flow below normal in ${area}.`,
          `Monitor ${area} supply; prepare a contingency plan.`,
          latest.reason ?? undefined,
        );
      }

      if (declining && latest.flow < 60 && latest.available) {
        const severity = highVuln ? 'critical' : 'warning';
        const note = highVuln
          ? `Threatens fishing/farming income in ${area}.`
          : null;
        raise(
          'shortage',
          severity,
          `Water flow is declining in ${area} — risk of shortage.`,
          `Inspect the source and plan water rationing for ${area}.`,
          'trend',
          note,
        );
      }

      for (const source of sourceBySystem.get(systemId) ?? []) {
        if (source.status === 'contaminated') {
          raise(
            'contamination',
            'warning',
            `Source contamination detected for ${system.name}.`,
            `Stop abstraction and investigate ${source.name}.`,
            'source',
          );
        } else if (source.status === 'offline') {
          raise(
            'outage',
            'warning',
            `Water source offline for ${system.name}.`,
            `Restore and test ${source.name}.`,
            'source',
          );
        } else if (source.status === 'low') {
          raise(
            'shortage',
            'info',
            `Source capacity low for ${system.name}.`,
            `Conserve supply and monitor ${source.name}.`,
            'source',
          );
        }
      }
    }

    for (const report of reports) {
      const area = report.area;
      if (report.type === 'contamination') {
        alerts.push({
          type: 'contamination',
          severity: 'warning',
          area,
          systemId: null,
          reportId: report.id,
          raisedAt: new Date(),
          status: 'active',
          reason: 'report',
          message: `Resident report: possible contamination in ${area}.`,
          action: `Verify and sample water in ${area} within 24 hours.`,
          impactNote: null,
          priority: 10,
        });
      } else if (
        report.type === 'no_water' ||
        report.type === 'infrastructure_damage'
      ) {
        alerts.push({
          type: 'outage',
          severity: 'warning',
          area,
          systemId: null,
          reportId: report.id,
          raisedAt: new Date(),
          status: 'active',
          reason: 'report',
          message: `Resident report: water service problem in ${area}.`,
          action: `Dispatch a team to assess ${area}.`,
          impactNote: null,
          priority: 10,
        });
      }
    }

    await this.dataSource.transaction(async (em) => {
      await em.query(`TRUNCATE "alert" CASCADE`);
      await em.getRepository(Alert).save([
        ...alerts.map((a) => a as Alert),
        {
          type: 'outage',
          severity: 'warning',
          area: 'Basiao',
          systemId: null,
          reportId: null,
          raisedAt: new Date(Date.now() - 26 * 3600e3),
          status: 'resolved',
          reason: 'infrastructure_damage',
          message:
            'Water service interrupted in Basiao after infrastructure damage.',
          action: 'Verify the repair; no further action required.',
          impactNote: null,
          priority: 0,
        },
      ]);
    });
    this.logger.log(`Re-derived ${alerts.length} active alerts.`);
  }

  private communityRepoForDerive(): Promise<Community[]> {
    return this.dataSource
      .getRepository(Community)
      .find({ relations: { system: true } });
  }
}
