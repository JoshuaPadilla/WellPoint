import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Community } from '../../../entities/community.entity';
import { CommunityReport } from '../../../entities/community-report.entity';
import { ServiceStatus } from '../../../entities/service-status.entity';
import { WaterSource } from '../../../entities/water-source.entity';
import { WaterSystem } from '../../../entities/water-system.entity';
import { Repository } from 'typeorm';
import { AlertSeverity, AlertStatus, AlertType } from '../../../entities/enums';
import { decliningTrend, type VulnerabilityResult } from './derive';
import { VulnerabilityService } from './vulnerability.service';

export interface AlertRecord {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  area: string;
  psgcCode: string | null;
  systemId: string | null;
  reportId: string | null;
  raisedAt: string;
  status: AlertStatus;
  reason: string | null;
  message: string;
  action: string;
}

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Community)
    private readonly communityRepo: Repository<Community>,
    @InjectRepository(WaterSystem)
    private readonly systemRepo: Repository<WaterSystem>,
    @InjectRepository(WaterSource)
    private readonly sourceRepo: Repository<WaterSource>,
    @InjectRepository(ServiceStatus)
    private readonly statusRepo: Repository<ServiceStatus>,
    @InjectRepository(CommunityReport)
    private readonly reportRepo: Repository<CommunityReport>,
    private readonly vulnerabilityService: VulnerabilityService,
  ) {}

  async deriveAll(): Promise<AlertRecord[]> {
    const [communities, systems, sources, statuses, reports] =
      await Promise.all([
        this.communityRepo.find(),
        this.systemRepo.find(),
        this.sourceRepo.find(),
        this.statusRepo.find({ order: { timestamp: 'ASC' } }),
        this.reportRepo.find({ where: { status: 'new' } }),
      ]);

    const sourcesByCommunity = new Map<string, WaterSource[]>();
    for (const source of sources) {
      if (!source.barangayId) {
        continue;
      }
      const list = sourcesByCommunity.get(source.barangayId) ?? [];
      list.push(source);
      sourcesByCommunity.set(source.barangayId, list);
    }

    const statusBySystem = new Map<string, ServiceStatus[]>();
    for (const status of statuses) {
      const list = statusBySystem.get(status.systemId) ?? [];
      list.push(status);
      statusBySystem.set(status.systemId, list);
    }

    const maxTimestamp =
      statuses.length > 0
        ? statuses[statuses.length - 1].timestamp.toISOString()
        : new Date(0).toISOString();

    const vulnerability = await this.vulnerabilityService.computeAll();

    const alerts: AlertRecord[] = [];

    for (const system of systems) {
      const community = communities.find((c) => c.systemId === system.id);
      if (!community) {
        continue;
      }
      const vuln = vulnerability.get(community.id);
      const history = statusBySystem.get(system.id) ?? [];
      const latest = history.length > 0 ? history[history.length - 1] : null;

      if (latest) {
        alerts.push(
          ...this.deriveStatusAlerts(system, community, latest, history, vuln),
        );
      }

      const communitySources = sourcesByCommunity.get(community.id) ?? [];
      alerts.push(
        ...this.deriveSourceAlerts(
          communitySources,
          community,
          system.id,
          maxTimestamp,
        ),
      );
    }

    for (const report of reports) {
      alerts.push(...this.deriveReportAlerts(report));
    }

    const nameToPsgc = new Map(communities.map((c) => [c.name, c.psgcCode]));
    const reportPsgc = new Map(reports.map((r) => [r.id, r.psgcCode]));
    for (const alert of alerts) {
      alert.psgcCode = alert.reportId
        ? (reportPsgc.get(alert.reportId) ?? null)
        : (nameToPsgc.get(alert.area) ?? null);
    }

    return alerts.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'active' ? -1 : 1;
      }
      if (SEVERITY_ORDER[a.severity] !== SEVERITY_ORDER[b.severity]) {
        return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      }
      return b.raisedAt.localeCompare(a.raisedAt);
    });
  }

  private deriveStatusAlerts(
    system: WaterSystem,
    community: Community,
    latest: ServiceStatus,
    history: ServiceStatus[],
    vuln: VulnerabilityResult | undefined,
  ): AlertRecord[] {
    const alerts: AlertRecord[] = [];
    const area = community.name;
    const raisedAt = latest.timestamp.toISOString();
    const highImpact = vuln?.tier === 'high';

    if (!latest.available) {
      alerts.push(
        this.alert({
          id: `${system.id}:outage`,
          type: 'outage',
          severity: 'critical',
          area,
          systemId: system.id,
          raisedAt,
          reason: latest.reason ?? 'outage',
          message: `Water service is down in ${area}.`,
          action: highImpact
            ? `Deploy emergency water to ${area} within 6 hours — an isolated barangay whose fishing and farming income depends on this supply.`
            : `Deploy emergency water to ${area} within 6 hours.`,
        }),
      );
    }

    if (latest.quality === 'unsafe') {
      alerts.push(
        this.alert({
          id: `${system.id}:contamination`,
          type: 'contamination',
          severity: 'critical',
          area,
          systemId: system.id,
          raisedAt,
          reason: latest.reason ?? 'contamination',
          message: `Water quality in ${area} is unsafe to drink.`,
          action: `Issue a boil-water advisory and dispatch a water-quality team to ${area}.`,
        }),
      );
    } else if (latest.quality === 'advisory') {
      alerts.push(
        this.alert({
          id: `${system.id}:contamination`,
          type: 'contamination',
          severity: 'warning',
          area,
          systemId: system.id,
          raisedAt,
          reason: latest.reason ?? 'contamination',
          message: `Water quality in ${area} is under advisory.`,
          action: `Advise ${area} residents to treat water before drinking and monitor quality.`,
        }),
      );
    }

    if (latest.flow < 25) {
      alerts.push(
        this.alert({
          id: `${system.id}:shortage`,
          type: 'shortage',
          severity: 'critical',
          area,
          systemId: system.id,
          raisedAt,
          reason: latest.reason ?? 'shortage',
          message: `Water supply in ${area} has fallen to ${Math.round(latest.flow)}% of normal.`,
          action: `Schedule water rationing and tanker delivery to ${area}.`,
        }),
      );
    } else if (latest.flow < 40) {
      alerts.push(
        this.alert({
          id: `${system.id}:shortage`,
          type: 'shortage',
          severity: 'warning',
          area,
          systemId: system.id,
          raisedAt,
          reason: latest.reason ?? 'shortage',
          message: `Water supply in ${area} is low (${Math.round(latest.flow)}% of normal).`,
          action: `Prepare a water-rationing plan for ${area}.`,
        }),
      );
    } else if (
      decliningTrend(
        history.map((s) => s.flow),
        latest.flow,
      )
    ) {
      const critical = highImpact;
      alerts.push(
        this.alert({
          id: `${system.id}:shortage:trend`,
          type: 'shortage',
          severity: critical ? 'critical' : 'warning',
          area,
          systemId: system.id,
          raisedAt,
          reason: 'declining trend',
          message: `Flow in ${area} is trending downward — a shortage is expected.`,
          action: critical
            ? `Act now: pre-position emergency water for ${area}, an isolated barangay.`
            : `Monitor ${area} and pre-stage a response.`,
        }),
      );
    }

    alerts.push(
      ...this.deriveResolvedAlerts(system.id, community, history, latest),
    );

    return alerts;
  }

  private deriveResolvedAlerts(
    systemId: string,
    community: Community,
    history: ServiceStatus[],
    latest: ServiceStatus,
  ): AlertRecord[] {
    const alerts: AlertRecord[] = [];
    const area = community.name;

    if (latest.available && history.some((s) => !s.available)) {
      alerts.push({
        id: `${systemId}:outage:resolved`,
        type: 'outage',
        severity: 'info',
        area,
        psgcCode: null,
        systemId,
        reportId: null,
        raisedAt: latest.timestamp.toISOString(),
        status: 'resolved',
        reason: 'service restored',
        message: `Service in ${area} has been restored after an interruption.`,
        action: `No further action required; continue monitoring ${area}.`,
      });
    }

    if (
      latest.quality === 'safe' &&
      history.some((s) => s.quality === 'unsafe' || s.quality === 'advisory')
    ) {
      alerts.push({
        id: `${systemId}:contamination:resolved`,
        type: 'contamination',
        severity: 'info',
        area,
        psgcCode: null,
        systemId,
        reportId: null,
        raisedAt: latest.timestamp.toISOString(),
        status: 'resolved',
        reason: 'quality restored',
        message: `Water quality in ${area} has returned to safe.`,
        action: `No further action required; continue monitoring ${area}.`,
      });
    }

    return alerts;
  }

  private deriveSourceAlerts(
    sources: WaterSource[],
    community: Community,
    systemId: string,
    raisedAt: string,
  ): AlertRecord[] {
    const alerts: AlertRecord[] = [];
    for (const source of sources) {
      const base = {
        id: `${source.id}:source`,
        area: community.name,
        systemId,
        reportId: null,
        raisedAt,
      };
      if (source.status === 'contaminated') {
        alerts.push(
          this.alert({
            ...base,
            type: 'contamination',
            severity: 'warning',
            reason: 'source contamination',
            message: `Source ${source.name} serving ${community.name} is contaminated.`,
            action: `Inspect and treat ${source.name}; consider an alternate source for ${community.name}.`,
          }),
        );
      } else if (source.status === 'offline') {
        alerts.push(
          this.alert({
            ...base,
            type: 'outage',
            severity: 'warning',
            reason: 'source offline',
            message: `Source ${source.name} serving ${community.name} is offline.`,
            action: `Dispatch a maintenance crew to restore ${source.name}.`,
          }),
        );
      } else if (source.status === 'low') {
        alerts.push(
          this.alert({
            ...base,
            type: 'shortage',
            severity: 'info',
            reason: 'source low',
            message: `Source ${source.name} serving ${community.name} is running low.`,
            action: `Monitor ${source.name} yield and reduce non-essential draw.`,
          }),
        );
      }
    }
    return alerts;
  }

  private deriveReportAlerts(report: CommunityReport): AlertRecord[] {
    const raisedAt = report.createdAt.toISOString();
    const area = report.area;
    if (report.type === 'contamination') {
      return [
        this.alert({
          id: `report:${report.id}`,
          type: 'contamination',
          severity: 'warning',
          area,
          systemId: null,
          reportId: report.id,
          raisedAt,
          reason: 'community report',
          message: `A resident reported possible contamination in ${area}.`,
          action: `Verify the contamination report in ${area} and test water quality.`,
        }),
      ];
    }
    if (report.type === 'no_water' || report.type === 'infrastructure_damage') {
      return [
        this.alert({
          id: `report:${report.id}`,
          type: 'outage',
          severity: 'warning',
          area,
          systemId: null,
          reportId: report.id,
          raisedAt,
          reason: 'community report',
          message: `A resident reported a service interruption in ${area}.`,
          action: `Investigate the reported interruption in ${area} and confirm service status.`,
        }),
      ];
    }
    return [];
  }

  private alert(
    input: Omit<AlertRecord, 'status' | 'psgcCode' | 'reportId'> & {
      reportId?: string | null;
    },
  ): AlertRecord {
    return {
      ...input,
      psgcCode: null,
      reportId: input.reportId ?? null,
      status: 'active',
    };
  }
}
