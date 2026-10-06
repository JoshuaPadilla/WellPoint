import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Community } from '../entities/community.entity';
import { ServiceStatus } from '../entities/service-status.entity';
import { CommunityReport } from '../entities/community-report.entity';
import { Alert } from '../entities/alert.entity';
import {
  VulnerabilityService,
  VulnerabilityView,
} from '../vulnerability/vulnerability.service';
import { accessState, AccessState } from '../derive';

export type BarangayView = {
  id: string;
  name: string;
  psgcCode: string;
  areaSqKm: number;
  distanceToCenterKm: number;
  population: number;
  affordability: number;
  lat: number;
  lng: number;
  systemId: string | null;
  systemLevel: 'I' | 'II' | 'III' | null;
  boundary: { type: string; coordinates: unknown };
  accessState: AccessState;
  vulnerability: VulnerabilityView;
};

export type BarangayDetailView = BarangayView & {
  trend: {
    timestamp: string;
    available: boolean;
    flow: number;
    quality: ServiceStatus['quality'];
  }[];
  openReports: CommunityReport[];
  alerts: Alert[];
};

@Injectable()
export class BarangaysService {
  constructor(
    @InjectRepository(Community)
    private readonly communityRepo: Repository<Community>,
    @InjectRepository(ServiceStatus)
    private readonly statusRepo: Repository<ServiceStatus>,
    @InjectRepository(CommunityReport)
    private readonly reportRepo: Repository<CommunityReport>,
    @InjectRepository(Alert) private readonly alertRepo: Repository<Alert>,
    private readonly vulnerability: VulnerabilityService,
  ) {}

  async listAll(): Promise<BarangayView[]> {
    const communities = await this.communityRepo.find({
      relations: { system: true },
      order: { name: 'ASC' },
    });
    const tiers = await this.vulnerability.forAll();
    const statuses = await this.statusRepo.find({
      order: { timestamp: 'ASC' },
    });
    const latestBySystem = new Map<string, ServiceStatus>();
    for (const s of statuses) latestBySystem.set(s.systemId, s);

    return communities.map((c) => {
      const status = c.systemId ? latestBySystem.get(c.systemId) : undefined;
      return this.toView(
        c,
        status
          ? {
              available: status.available,
              flow: status.flow,
              quality: status.quality,
            }
          : null,
        tiers.get(c.id),
      );
    });
  }

  async detail(id: string): Promise<BarangayDetailView> {
    const community = await this.communityRepo.findOne({
      where: { id },
      relations: { system: true },
    });
    if (!community) throw new NotFoundException(`Barangay ${id} not found`);
    const tiers = await this.vulnerability.forAll();

    const statuses = community.systemId
      ? await this.statusRepo.find({
          where: { systemId: community.systemId },
          order: { timestamp: 'ASC' },
        })
      : [];
    const latest = statuses[statuses.length - 1];
    const alerts = await this.alertRepo.find({
      where: [{ area: community.name }, { systemId: community.systemId ?? '' }],
      order: { priority: 'DESC', raisedAt: 'DESC' },
    });
    const openReports = await this.reportRepo.find({
      where: { area: community.name },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      ...this.toView(
        community,
        latest
          ? {
              available: latest.available,
              flow: latest.flow,
              quality: latest.quality,
            }
          : null,
        tiers.get(community.id),
      ),
      trend: statuses.map((s) => ({
        timestamp: s.timestamp.toISOString(),
        available: s.available,
        flow: Math.round(s.flow * 10) / 10,
        quality: s.quality,
      })),
      openReports,
      alerts,
    };
  }

  private toView(
    c: Community,
    status: {
      available: boolean;
      flow: number;
      quality: ServiceStatus['quality'];
    } | null,
    vulnerability: VulnerabilityView | undefined,
  ): BarangayView {
    return {
      id: c.id,
      name: c.name,
      psgcCode: c.psgcCode,
      areaSqKm: Math.round(c.areaSqKm * 100) / 100,
      distanceToCenterKm: Math.round(c.distanceToCenterKm * 100) / 100,
      population: c.population,
      affordability: c.affordability,
      lat: c.lat,
      lng: c.lng,
      systemId: c.systemId,
      systemLevel: c.system?.level ?? null,
      boundary: c.boundary ?? { type: 'Polygon', coordinates: [] },
      accessState: accessState(c.affordability, status),
      vulnerability: vulnerability ?? { isolation: 0, tier: 'low' },
    };
  }
}
