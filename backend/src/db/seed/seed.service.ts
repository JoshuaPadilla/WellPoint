import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { existsSync, readFileSync } from 'fs';
import * as path from 'path';
import { DEFAULT_LGU_ID } from '../../common/constants';
import { Community } from '../../entities/community.entity';
import { CommunityReport } from '../../entities/community-report.entity';
import { ServiceStatus } from '../../entities/service-status.entity';
import { WaterSource } from '../../entities/water-source.entity';
import { WaterSystem } from '../../entities/water-system.entity';
import { ExternalIdentity } from '../../modules/users/entity/external-identity.entity';
import { Membership } from '../../modules/users/entity/membership.entity';
import { User } from '../../modules/users/entity/user.entity';
import { Repository } from 'typeorm';
import { DEMO_ACCOUNTS } from './auth-seed';
import { GeoFeature, geometryCentroid, haversineKm } from './geo';
import { mulberry32 } from './mulberry32';
import {
  BASE_SEED,
  BASE_TIME_MS,
  PILOT_SYSTEMS,
  POBLACION_CENTER_PSGC,
  TICK_INTERVAL_MS,
} from './seed-data';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

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
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ExternalIdentity)
    private readonly identityRepo: Repository<ExternalIdentity>,
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seed();
  }

  async seed(): Promise<void> {
    const communities = await this.importCommunities();
    if ((await this.statusRepo.count()) === 0) {
      await this.seedWaterData(communities);
    }
    await this.seedDemoAccounts();
  }

  async reset(): Promise<void> {
    this.logger.log('Resetting demo state…');
    await this.reportRepo.clear();
    await this.statusRepo.clear();
    await this.sourceRepo.clear();
    await this.systemRepo.clear();
    await this.communityRepo.clear();
    await this.seed();
  }

  private async importCommunities(): Promise<Map<string, Community>> {
    const features = loadGeoFeatures();
    const center = resolveCenter(features);
    const rng = mulberry32(BASE_SEED);
    const map = new Map<string, Community>();

    for (const feature of features) {
      const centroid = geometryCentroid(feature.geometry);
      const distanceToCenterKm =
        center.lat === 0 && center.lng === 0
          ? 0
          : haversineKm(centroid.lat, centroid.lng, center.lat, center.lng);

      const pilot = PILOT_SYSTEMS.find((p) => p.psgcCode === feature.psgcCode);
      const affordability = pilot
        ? pilot.affordability
        : 45 + Math.round(rng() * 30);
      const population = pilot
        ? pilot.population
        : Math.max(400, Math.round(feature.areaSqKm * (350 + rng() * 450)));

      let community = await this.communityRepo.findOne({
        where: { psgcCode: feature.psgcCode },
      });
      if (!community) {
        community = this.communityRepo.create({
          psgcCode: feature.psgcCode,
        });
      }

      community.name = feature.name;
      community.areaSqKm = feature.areaSqKm;
      community.boundary = feature.geometry;
      community.lat = centroid.lat;
      community.lng = centroid.lng;
      community.distanceToCenterKm = Number(distanceToCenterKm.toFixed(3));
      community.affordability = affordability;
      community.population = population;

      await this.communityRepo.save(community);
      map.set(feature.psgcCode, community);
    }

    this.logger.log(`Seeded ${map.size} barangays.`);
    return map;
  }

  private async seedWaterData(
    communities: Map<string, Community>,
  ): Promise<void> {
    for (const pilot of PILOT_SYSTEMS) {
      const community = communities.get(pilot.psgcCode);
      if (!community) {
        this.logger.warn(
          `Pilot barangay ${pilot.psgcCode} not found in GeoJSON; skipping.`,
        );
        continue;
      }

      let system = await this.systemRepo.findOne({
        where: { name: pilot.name },
      });
      if (!system) {
        system = this.systemRepo.create({ name: pilot.name });
      }
      system.level = pilot.level;
      system.coverageArea = pilot.coverageArea;
      system.serviceHours = pilot.serviceHours;
      system.operator = pilot.operator;
      await this.systemRepo.save(system);

      const sourceIds: string[] = [];
      for (const def of pilot.sources) {
        let source = await this.sourceRepo.findOne({
          where: { name: def.name },
        });
        if (!source) {
          source = this.sourceRepo.create({ name: def.name });
        }
        source.type = def.type;
        source.lat = community.lat + def.offsetLat;
        source.lng = community.lng + def.offsetLng;
        source.barangayId = community.id;
        source.capacity = def.capacity;
        source.status = def.status;
        await this.sourceRepo.save(source);
        sourceIds.push(source.id);
      }

      system.sourceIds = sourceIds;
      await this.systemRepo.save(system);

      community.systemId = system.id;
      await this.communityRepo.save(community);

      const statuses = pilot.ticks.map((t, i) =>
        this.statusRepo.create({
          systemId: system.id,
          timestamp: new Date(BASE_TIME_MS + i * TICK_INTERVAL_MS),
          available: t.available,
          flow: t.flow,
          quality: t.quality,
          reason: t.reason,
        }),
      );
      await this.statusRepo.save(statuses);
    }
  }

  private async seedDemoAccounts(): Promise<void> {
    for (const account of DEMO_ACCOUNTS) {
      let user = await this.userRepo.findOne({
        where: { email: account.email },
      });
      if (!user) {
        user = this.userRepo.create({
          email: account.email,
          name: account.name,
          state: 'active',
        });
        user = await this.userRepo.save(user);
      }

      let membership = await this.membershipRepo.findOne({
        where: { userId: user.id, role: account.role },
      });
      if (!membership) {
        membership = this.membershipRepo.create({
          userId: user.id,
          role: account.role,
        });
      }
      membership.lguId = DEFAULT_LGU_ID;
      membership.barangayPsgc = account.barangayPsgc;
      membership.active = true;
      await this.membershipRepo.save(membership);
    }
  }
}

function loadGeoFeatures(): GeoFeature[] {
  const candidates = [
    process.env.GEOJSON_PATH,
    path.resolve(process.cwd(), '..', 'seed-data', 'catbalogan-brgys.geojson'),
    path.resolve(process.cwd(), 'seed-data', 'catbalogan-brgys.geojson'),
  ].filter((p): p is string => Boolean(p));

  const filePath = candidates.find((p) => existsSync(p));
  if (!filePath) {
    throw new Error(
      'catbalogan-brgys.geojson not found. Set GEOJSON_PATH or mount seed-data.',
    );
  }

  const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as {
    features: Array<{
      properties: Record<string, unknown>;
      geometry: { type: string; coordinates: unknown };
    }>;
  };

  const features: GeoFeature[] = [];
  for (const f of raw.features ?? []) {
    const name = ((f.properties['ADM4_EN'] as string | null) ?? '').trim();
    const psgcCode = (
      (f.properties['psgc_code'] as string | null) ?? ''
    ).trim();
    const areaSqKm = Number(f.properties['AREA_SQKM'] ?? 0);
    if (!name || !psgcCode) {
      continue;
    }
    features.push({
      name,
      psgcCode,
      areaSqKm,
      geometry: f.geometry,
    });
  }
  return features;
}

function resolveCenter(features: GeoFeature[]): { lat: number; lng: number } {
  const anchor = features.find((f) => f.psgcCode === POBLACION_CENTER_PSGC);
  if (anchor) {
    const c = geometryCentroid(anchor.geometry);
    return { lat: c.lat, lng: c.lng };
  }
  const first = features[0];
  if (first) {
    const c = geometryCentroid(first.geometry);
    return { lat: c.lat, lng: c.lng };
  }
  return { lat: 0, lng: 0 };
}
