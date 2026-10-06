import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Community } from '../../entities/community.entity';
import { WaterSystem } from '../../entities/water-system.entity';
import { WaterSource } from '../../entities/water-source.entity';
import { ServiceStatus } from '../../entities/service-status.entity';
import { CommunityReport } from '../../entities/community-report.entity';
import { Alert } from '../../entities/alert.entity';
import { GeoJSONFile, geometryCentroid, haversineKm } from '../geo';
import { mulberry32 } from '../mulberry32';
import { AlertsService } from '../../alerts/alerts.service';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly alerts: AlertsService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const count = await this.dataSource.getRepository(Community).count();
    if (count === 0) {
      this.logger.log('Empty database — seeding known-good state…');
      await this.seed();
      await this.alerts.derive();
    } else {
      this.logger.log(
        `Database already seeded (${count} barangays) — skipping.`,
      );
    }
  }

  async seed(): Promise<void> {
    const path = resolve(
      process.cwd(),
      '..',
      'seed-data',
      'catbalogan-brgys.geojson',
    );
    const file: GeoJSONFile = JSON.parse(
      readFileSync(path, 'utf8'),
    ) as GeoJSONFile;

    const communities = this.buildCommunities(file);
    const pilotSystems = this.buildSystems();
    const pilotStatus = this.buildStatusSeries();
    const pilotSources = this.buildSources();

    await this.dataSource.transaction(async (em) => {
      for (const table of [
        'community_report',
        'alert',
        'service_status',
        'water_source',
        'community',
        'water_system',
      ]) {
        await em.query(`TRUNCATE "${table}" CASCADE`);
      }

      const systemRepo = em.getRepository(WaterSystem);
      const sourceRepo = em.getRepository(WaterSource);
      const statusRepo = em.getRepository(ServiceStatus);
      const reportRepo = em.getRepository(CommunityReport);
      const alertRepo = em.getRepository(Alert);

      const systems = await systemRepo.save(pilotSystems);
      const systemByName = new Map(systems.map((s) => [s.name, s.id]));
      const systemByBrgy = new Map<string, string>();

      for (const [brgy, sysName] of [
        ['Poblacion 1', 'Poblacion 1 Level III System'],
        ['San Andres', 'San Andres Level II System'],
        ['Mercedes', 'Mercedes Level II System'],
        ['Bangon', 'Bangon Level I System'],
        ['Canlapwas', 'Canlapwas Level I System'],
      ] as const) {
        const community = communities.find((c) => c.name.startsWith(brgy));
        if (community)
          systemByBrgy.set(community.psgcCode, systemByName.get(sysName)!);
      }

      for (const c of communities) {
        c.systemId = systemByBrgy.get(c.psgcCode) ?? null;
      }
      const savedCommunities = await em
        .getRepository(Community)
        .save(communities);
      const brgyByPsgc = new Map(
        savedCommunities.map((c) => [c.psgcCode, c.id]),
      );

      const sources = pilotSources.map((s) => ({
        ...s,
        barangayId: s.barangayPsgc
          ? (brgyByPsgc.get(s.barangayPsgc) ?? null)
          : null,
        systemId: s.systemName
          ? (systemByName.get(s.systemName) ?? null)
          : null,
      }));
      await sourceRepo.save(sources);

      const now = Date.now();
      const samples: Omit<ServiceStatus, 'id'>[] = [];
      for (const series of pilotStatus) {
        const systemId = systemByName.get(series.system);
        if (!systemId) continue;
        for (const tick of series.ticks) {
          samples.push({
            systemId,
            timestamp: new Date(now - tick.hoursAgo * 3600e3),
            available: tick.available,
            flow: tick.flow,
            quality: tick.quality,
            reason: tick.reason ?? null,
          });
        }
      }
      await statusRepo.save(samples);

      await reportRepo.save({
        reporter: 'Barangay Official',
        area: 'Basiao',
        type: 'infrastructure_damage',
        description:
          'Broken line after the recent storm, already repaired by DPWH.',
        status: 'resolved',
        createdAt: new Date(now - 26 * 3600e3),
      });

      await alertRepo.save({
        type: 'outage',
        severity: 'warning',
        area: 'Basiao',
        systemId: null,
        reportId: null,
        raisedAt: new Date(now - 26 * 3600e3),
        status: 'resolved',
        reason: 'infrastructure_damage',
        message:
          'Water service interrupted in Basiao after infrastructure damage.',
        action: 'Verify the repair; no further action required.',
        impactNote: null,
        priority: 0,
      });
    });

    this.logger.log(
      `Seeded ${communities.length} barangays, ${pilotSystems.length} systems, ${pilotStatus.reduce((n, s) => n + s.ticks.length, 0)} status samples.`,
    );
  }

  private buildCommunities(file: GeoJSONFile): Omit<Community, 'id'>[] {
    const rng = mulberry32(20261006);
    const out: Omit<Community, 'id'>[] = [];
    for (const feature of file.features) {
      const p = feature.properties;
      const name = p.ADM4_EN as string;
      const psgcCode = (p.psgc_code as string) ?? (p.ADM4_PCODE as string);
      if (!name || !psgcCode) continue;
      const areaSqKm = Number(p.AREA_SQKM ?? 0);
      const { lat, lng } = geometryCentroid(feature.geometry);
      out.push({
        name,
        psgcCode,
        areaSqKm,
        boundary: feature.geometry,
        distanceToCenterKm: 0,
        population: Math.max(
          150,
          Math.round((150 + rng() * 1400) * (0.4 + areaSqKm / 25)),
        ),
        affordability: 40,
        lat,
        lng,
        systemId: null,
        system: null,
      });
    }
    const center = out.find((c) => c.name.includes('Poblacion 1'))!;
    for (const c of out) {
      c.distanceToCenterKm = haversineKm(center.lat, center.lng, c.lat, c.lng);
      const nearness = Math.max(0, 1 - c.distanceToCenterKm / 15);
      c.affordability = Math.min(
        98,
        Math.max(5, Math.round(25 + 68 * nearness + rng() * 8)),
      );
    }
    for (const name of [
      ['Poblacion 1', 92],
      ['San Andres', 66],
      ['Mercedes', 60],
      ['Bangon', 32],
      ['Canlapwas', 18],
    ] as const) {
      const c = out.find((x) => x.name.startsWith(name[0]));
      if (c) c.affordability = name[1];
    }
    return out;
  }

  private buildSystems(): Omit<WaterSystem, 'id'>[] {
    return [
      {
        name: 'Poblacion 1 Level III System',
        level: 'III',
        coverageArea: 'Poblacion cluster',
        serviceHours: 24,
        operator: 'Catbalogan City Water Office',
      },
      {
        name: 'San Andres Level II System',
        level: 'II',
        coverageArea: 'San Andres',
        serviceHours: 18,
        operator: 'Catbalogan City Water Office',
      },
      {
        name: 'Mercedes Level II System',
        level: 'II',
        coverageArea: 'Mercedes',
        serviceHours: 16,
        operator: 'Barangay Water Association',
      },
      {
        name: 'Bangon Level I System',
        level: 'I',
        coverageArea: 'Bangon',
        serviceHours: 10,
        operator: 'Barangay Water Association',
      },
      {
        name: 'Canlapwas Level I System',
        level: 'I',
        coverageArea: 'Canlapwas',
        serviceHours: 8,
        operator: 'Barangay Water Association',
      },
    ];
  }

  private buildSources(): (Omit<
    WaterSource,
    'id' | 'barangayId' | 'systemId'
  > & {
    barangayPsgc?: string | null;
    systemName?: string | null;
  })[] {
    return [
      {
        name: 'Catbalogan Reservoir',
        type: 'reservoir',
        lat: 11.772,
        lng: 124.885,
        capacity: 4200,
        status: 'ok',
        barangayPsgc: null,
        systemName: 'Poblacion 1 Level III System',
      },
      {
        name: 'San Andres Spring',
        type: 'spring',
        lat: 11.805,
        lng: 124.845,
        capacity: 900,
        status: 'ok',
        barangayPsgc: null,
        systemName: 'San Andres Level II System',
      },
      {
        name: 'Mercedes Deep Well',
        type: 'groundwater',
        lat: 11.79,
        lng: 124.9,
        capacity: 750,
        status: 'ok',
        barangayPsgc: null,
        systemName: 'Mercedes Level II System',
      },
      {
        name: 'Bangon Spring',
        type: 'spring',
        lat: 11.85,
        lng: 124.82,
        capacity: 420,
        status: 'low',
        barangayPsgc: null,
        systemName: 'Bangon Level I System',
      },
      {
        name: 'Canlapwas River Intake',
        type: 'river',
        lat: 11.88,
        lng: 124.78,
        capacity: 600,
        status: 'contaminated',
        barangayPsgc: null,
        systemName: 'Canlapwas Level I System',
      },
    ];
  }

  private buildStatusSeries(): {
    system: string;
    ticks: {
      hoursAgo: number;
      available: boolean;
      flow: number;
      quality: 'safe' | 'advisory' | 'unsafe';
      reason?: 'drought' | 'typhoon' | 'maintenance' | 'contamination';
    }[];
  }[] {
    return [
      {
        system: 'Poblacion 1 Level III System',
        ticks: [
          { hoursAgo: 9, available: true, flow: 96, quality: 'safe' },
          { hoursAgo: 6, available: true, flow: 98, quality: 'safe' },
          { hoursAgo: 3, available: true, flow: 94, quality: 'safe' },
          { hoursAgo: 0, available: true, flow: 97, quality: 'safe' },
        ],
      },
      {
        system: 'San Andres Level II System',
        ticks: [
          { hoursAgo: 9, available: true, flow: 68, quality: 'safe' },
          { hoursAgo: 6, available: true, flow: 62, quality: 'safe' },
          { hoursAgo: 3, available: true, flow: 55, quality: 'safe' },
          { hoursAgo: 0, available: true, flow: 50, quality: 'safe' },
        ],
      },
      {
        system: 'Mercedes Level II System',
        ticks: [
          { hoursAgo: 9, available: true, flow: 45, quality: 'safe' },
          { hoursAgo: 6, available: true, flow: 42, quality: 'safe' },
          {
            hoursAgo: 3,
            available: true,
            flow: 38,
            quality: 'advisory',
            reason: 'maintenance',
          },
          {
            hoursAgo: 0,
            available: true,
            flow: 36,
            quality: 'advisory',
            reason: 'maintenance',
          },
        ],
      },
      {
        system: 'Bangon Level I System',
        ticks: [
          { hoursAgo: 9, available: true, flow: 55, quality: 'safe' },
          { hoursAgo: 6, available: true, flow: 50, quality: 'safe' },
          {
            hoursAgo: 3,
            available: true,
            flow: 46,
            quality: 'safe',
            reason: 'drought',
          },
          {
            hoursAgo: 0,
            available: true,
            flow: 43,
            quality: 'safe',
            reason: 'drought',
          },
        ],
      },
      {
        system: 'Canlapwas Level I System',
        ticks: [
          { hoursAgo: 12, available: true, flow: 58, quality: 'safe' },
          { hoursAgo: 8, available: true, flow: 40, quality: 'advisory' },
          {
            hoursAgo: 4,
            available: true,
            flow: 22,
            quality: 'unsafe',
            reason: 'contamination',
          },
          {
            hoursAgo: 0,
            available: false,
            flow: 0,
            quality: 'unsafe',
            reason: 'contamination',
          },
        ],
      },
    ];
  }
}
