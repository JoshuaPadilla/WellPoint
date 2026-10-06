import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Community } from '../../../entities/community.entity';
import { CommunityReport } from '../../../entities/community-report.entity';
import { ServiceStatus } from '../../../entities/service-status.entity';
import { WaterSource } from '../../../entities/water-source.entity';
import { WaterSystem } from '../../../entities/water-system.entity';
import { Repository } from 'typeorm';
import type {
  BarangayDetailDto,
  CommunityDto,
  PublicStatusDto,
  StatusItemDto,
  WaterSourceDto,
} from '../../../schemas/domain.schema';
import { AlertsService } from './alerts.service';
import { deriveAccessState, type VulnerabilityResult } from './derive';
import { VulnerabilityService } from './vulnerability.service';

@Injectable()
export class ReadModelsService {
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
    private readonly alertsService: AlertsService,
  ) {}

  async listStatus(): Promise<StatusItemDto[]> {
    const [systems, statuses, communities] = await Promise.all([
      this.systemRepo.find(),
      this.statusRepo.find({ order: { timestamp: 'ASC' } }),
      this.communityRepo.find(),
    ]);

    const latestBySystem = new Map<string, ServiceStatus>();
    for (const status of statuses) {
      latestBySystem.set(status.systemId, status);
    }

    return systems.map((system) => {
      const community = communities.find((c) => c.systemId === system.id);
      const status = latestBySystem.get(system.id);
      return {
        systemId: system.id,
        systemName: system.name,
        area: community?.name ?? system.coverageArea,
        level: system.level as StatusItemDto['level'],
        timestamp: status?.timestamp.toISOString() ?? '',
        available: status?.available ?? false,
        flow: status?.flow ?? 0,
        quality: (status?.quality ?? 'safe') as StatusItemDto['quality'],
        reason: (status?.reason ?? null) as StatusItemDto['reason'],
      };
    });
  }

  async listSources(scopePsgc?: string | null): Promise<WaterSourceDto[]> {
    const [sources, communities] = await Promise.all([
      this.sourceRepo.find(),
      this.communityRepo.find(),
    ]);

    const communityById = new Map(communities.map((c) => [c.id, c]));
    const communityByPsgc = new Map(communities.map((c) => [c.psgcCode, c]));

    return sources
      .filter((source) => {
        if (!scopePsgc) {
          return true;
        }
        const community = source.barangayId
          ? communityById.get(source.barangayId)
          : undefined;
        return community?.psgcCode === scopePsgc;
      })
      .map((source) => {
        const community = source.barangayId
          ? communityById.get(source.barangayId)
          : undefined;
        void communityByPsgc;
        return {
          id: source.id,
          name: source.name,
          type: source.type as WaterSourceDto['type'],
          lat: source.lat,
          lng: source.lng,
          barangayId: source.barangayId,
          barangayName: community?.name ?? null,
          capacity: source.capacity,
          status: source.status as WaterSourceDto['status'],
        };
      });
  }

  async listBarangays(scopePsgc?: string | null): Promise<CommunityDto[]> {
    const [communities, systems, statuses] = await Promise.all([
      this.communityRepo.find(),
      this.systemRepo.find(),
      this.statusRepo.find({ order: { timestamp: 'ASC' } }),
    ]);
    const vulnerability = await this.vulnerabilityService.computeAll();

    const systemById = new Map(systems.map((s) => [s.id, s]));
    const latestBySystem = new Map<string, ServiceStatus>();
    for (const status of statuses) {
      latestBySystem.set(status.systemId, status);
    }

    return communities
      .filter((c) => (scopePsgc ? c.psgcCode === scopePsgc : true))
      .map((community) =>
        this.toCommunityDto(
          community,
          systemById,
          latestBySystem,
          vulnerability,
        ),
      );
  }

  async barangayDetail(id: string): Promise<BarangayDetailDto | null> {
    const community = await this.communityRepo.findOne({ where: { id } });
    if (!community) {
      return null;
    }

    const [systems, sources, statuses, reports, alerts, communities] =
      await Promise.all([
        this.systemRepo.find(),
        this.sourceRepo.find(),
        this.statusRepo.find({
          where: { systemId: community.systemId ?? undefined },
          order: { timestamp: 'ASC' },
        }),
        this.reportRepo.find({
          where: { psgcCode: community.psgcCode },
          order: { createdAt: 'DESC' },
        }),
        this.alertsService.deriveAll(),
        this.communityRepo.find(),
      ]);

    const system = community.systemId
      ? (systems.find((s) => s.id === community.systemId) ?? null)
      : null;
    const systemSources = system
      ? sources.filter((s) => system.sourceIds?.includes(s.id))
      : [];

    const communityById = new Map(communities.map((c) => [c.id, c]));

    const openReports = reports.filter((r) => r.status === 'new');
    const communityAlerts = alerts.filter((a) => a.area === community.name);

    const vulnerability = await this.vulnerabilityService.computeAll();
    const vuln = vulnerability.get(community.id) ?? {
      tier: 'low' as const,
      isolation: 0,
      levelRisk: 0,
      capacityRisk: 0,
      score: 0,
    };

    const latestBySystem = new Map<string, ServiceStatus>();
    for (const status of statuses) {
      latestBySystem.set(status.systemId, status);
    }

    const detail = this.toCommunityDto(
      community,
      new Map(systems.map((s) => [s.id, s])),
      latestBySystem,
      vulnerability,
    );

    return {
      community: detail,
      system: system
        ? {
            id: system.id,
            name: system.name,
            level: system.level as 'I' | 'II' | 'III',
            coverageArea: system.coverageArea,
            serviceHours: system.serviceHours,
            operator: system.operator,
            sourceIds: system.sourceIds ?? [],
          }
        : null,
      sources: systemSources.map((s) => {
        const c = s.barangayId ? communityById.get(s.barangayId) : undefined;
        return {
          id: s.id,
          name: s.name,
          type: s.type as WaterSourceDto['type'],
          lat: s.lat,
          lng: s.lng,
          barangayId: s.barangayId,
          barangayName: c?.name ?? null,
          capacity: s.capacity,
          status: s.status as WaterSourceDto['status'],
        };
      }),
      statusHistory: statuses.map((s) => ({
        systemId: s.systemId,
        timestamp: s.timestamp.toISOString(),
        available: s.available,
        flow: s.flow,
        quality:
          s.quality as BarangayDetailDto['statusHistory'][number]['quality'],
        reason: (s.reason ??
          null) as BarangayDetailDto['statusHistory'][number]['reason'],
      })),
      alerts: communityAlerts,
      openReports: openReports.map((r) => this.toReportDto(r)),
      vulnerability: vuln,
    };
  }

  async listPublicBarangays(): Promise<
    Array<{ id: string; name: string; psgcCode: string }>
  > {
    const communities = await this.communityRepo.find({
      order: { name: 'ASC' },
    });
    return communities.map((c) => ({
      id: c.id,
      name: c.name,
      psgcCode: c.psgcCode,
    }));
  }

  async publicStatus(id: string): Promise<PublicStatusDto | null> {
    const detail = await this.barangayDetail(id);
    if (!detail) {
      return null;
    }

    const latest = detail.statusHistory[detail.statusHistory.length - 1];
    const available = latest?.available ?? false;
    const quality = latest?.quality ?? 'safe';
    const affordable = detail.community.affordability >= 40;

    const activeAlerts = detail.alerts.filter((a) => a.status === 'active');
    const summary = this.publicSummary(
      detail.community.name,
      available,
      quality,
      affordable,
    );

    return {
      barangay: detail.community.name,
      available,
      quality,
      affordable,
      summary,
      alerts: activeAlerts.slice(0, 3).map((a) => ({
        type: a.type,
        severity: a.severity,
        message: a.message,
        action: a.action,
      })),
      contacts: [
        {
          name: 'Catbalogan City Water Office',
          contact: '(055) 543-8000',
        },
        {
          name: 'City DRRM Office',
          contact: '(055) 543-8001',
        },
      ],
    };
  }

  private toCommunityDto(
    community: Community,
    systemById: Map<string, WaterSystem>,
    latestBySystem: Map<string, ServiceStatus>,
    vulnerability: Map<string, VulnerabilityResult>,
  ): CommunityDto {
    const system = community.systemId
      ? systemById.get(community.systemId)
      : undefined;
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
    const vuln = vulnerability.get(community.id);

    return {
      id: community.id,
      name: community.name,
      psgcCode: community.psgcCode,
      areaSqKm: community.areaSqKm,
      distanceToCenterKm: community.distanceToCenterKm,
      population: community.population,
      affordability: community.affordability,
      lat: community.lat,
      lng: community.lng,
      boundary: community.boundary,
      systemId: community.systemId,
      serviceLevel: (system?.level ?? null) as CommunityDto['serviceLevel'],
      accessState,
      vulnerabilityTier: vuln?.tier ?? 'low',
    };
  }

  private toReportDto(r: CommunityReport) {
    return {
      id: r.id,
      reporter: r.reporter,
      area: r.area,
      psgcCode: r.psgcCode,
      type: r.type as
        | 'no_water'
        | 'low_pressure'
        | 'contamination'
        | 'infrastructure_damage'
        | 'other',
      description: r.description,
      status: r.status as 'new' | 'acknowledged' | 'resolved',
      createdAt: r.createdAt.toISOString(),
    };
  }

  private publicSummary(
    name: string,
    available: boolean,
    quality: string,
    affordable: boolean,
  ): string {
    if (!available) {
      return `Water service is currently down in ${name}. Emergency water is being coordinated.`;
    }
    if (quality === 'unsafe') {
      return `Water in ${name} is available but not safe to drink right now. Boil water before use.`;
    }
    if (quality === 'advisory') {
      return `Water in ${name} is available but under a quality advisory.`;
    }
    if (!affordable) {
      return `Water in ${name} is available but may not be affordable for all households.`;
    }
    return `Water in ${name} is available, safe to drink, and affordable today.`;
  }
}
