import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WaterSource } from './water-source.entity';

@Injectable()
export class SourcesService {
  constructor(
    @InjectRepository(WaterSource)
    private readonly sourceRepo: Repository<WaterSource>,
  ) {}

  findAll(): Promise<WaterSource[]> {
    return this.sourceRepo.find();
  }

  findByBarangay(psgcCode: string): Promise<WaterSource[]> {
    return this.sourceRepo.find({ where: { barangayId: psgcCode } });
  }
}
