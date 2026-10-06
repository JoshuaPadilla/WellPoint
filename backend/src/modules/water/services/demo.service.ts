import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Community } from '../../../entities/community.entity';
import { ServiceStatus } from '../../../entities/service-status.entity';
import { WaterSystem } from '../../../entities/water-system.entity';
import { Repository } from 'typeorm';
import { SeedService } from '../../../db/seed/seed.service';
import type { DisruptionType } from '../../../entities/enums';

type WaterQualityValue = 'safe' | 'advisory' | 'unsafe';

interface DisruptionTick {
  available: boolean;
  flow: number;
  quality: WaterQualityValue;
  reason: DisruptionType | null;
}

const DEFAULT_TARGET_PSGC = '0806005051';
const SAMPLE_SPACING_MS = 5 * 60 * 1000;

function disruptionTicks(type: DisruptionType): DisruptionTick[] {
  switch (type) {
    case 'typhoon':
      return [
        { available: true, flow: 30, quality: 'advisory', reason: 'typhoon' },
        { available: false, flow: 0, quality: 'unsafe', reason: 'typhoon' },
        { available: false, flow: 0, quality: 'unsafe', reason: 'typhoon' },
        { available: false, flow: 0, quality: 'unsafe', reason: 'typhoon' },
      ];
    case 'drought':
      return [
        { available: true, flow: 40, quality: 'safe', reason: 'drought' },
        { available: true, flow: 32, quality: 'safe', reason: 'drought' },
        { available: true, flow: 24, quality: 'safe', reason: 'drought' },
        { available: true, flow: 15, quality: 'safe', reason: 'drought' },
      ];
    case 'contamination':
      return [
        {
          available: true,
          flow: 50,
          quality: 'advisory',
          reason: 'contamination',
        },
        {
          available: true,
          flow: 48,
          quality: 'unsafe',
          reason: 'contamination',
        },
        {
          available: true,
          flow: 45,
          quality: 'unsafe',
          reason: 'contamination',
        },
      ];
    case 'maintenance':
      return [
        { available: true, flow: 60, quality: 'safe', reason: null },
        { available: false, flow: 0, quality: 'safe', reason: 'maintenance' },
        { available: false, flow: 0, quality: 'safe', reason: 'maintenance' },
      ];
  }
}

@Injectable()
export class DemoService {
  constructor(
    @InjectRepository(ServiceStatus)
    private readonly statusRepo: Repository<ServiceStatus>,
    @InjectRepository(WaterSystem)
    private readonly systemRepo: Repository<WaterSystem>,
    @InjectRepository(Community)
    private readonly communityRepo: Repository<Community>,
    private readonly seedService: SeedService,
  ) {}

  async simulate(dto: {
    type: DisruptionType;
    targetSystemId?: string;
  }): Promise<void> {
    const system = await this.resolveTarget(dto.targetSystemId);
    const ticks = disruptionTicks(dto.type);
    const now = Date.now();

    const statuses = ticks.map((tick, i) => {
      const offset = (ticks.length - 1 - i) * SAMPLE_SPACING_MS;
      return this.statusRepo.create({
        systemId: system.id,
        timestamp: new Date(now - offset),
        available: tick.available,
        flow: tick.flow,
        quality: tick.quality,
        reason: tick.reason,
      });
    });
    await this.statusRepo.save(statuses);
  }

  async reset(): Promise<void> {
    await this.seedService.reset();
  }

  private async resolveTarget(targetSystemId?: string): Promise<WaterSystem> {
    if (targetSystemId) {
      const system = await this.systemRepo.findOne({
        where: { id: targetSystemId },
      });
      if (system) {
        return system;
      }
    }

    const defaultCommunity = await this.communityRepo.findOne({
      where: { psgcCode: DEFAULT_TARGET_PSGC },
    });
    if (defaultCommunity?.systemId) {
      const system = await this.systemRepo.findOne({
        where: { id: defaultCommunity.systemId },
      });
      if (system) {
        return system;
      }
    }

    const fallback = await this.systemRepo.find({ take: 1 });
    if (fallback.length > 0) {
      return fallback[0];
    }
    throw new NotFoundException('No water system available to simulate.');
  }
}
