import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WaterSource } from './water-source.entity';

export interface CreateSourceDto {
  name: string;
  type: WaterSource['type'];
  lat: number;
  lng: number;
  barangayId?: string;
  capacity?: number;
  status?: string;
}

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

  create(data: CreateSourceDto): Promise<WaterSource> {
    return this.sourceRepo.save(this.sourceRepo.create(data));
  }

  async update(
    id: number,
    data: Partial<CreateSourceDto>,
  ): Promise<WaterSource | null> {
    const existing = await this.sourceRepo.findOneBy({ id });
    if (!existing) return null;
    Object.assign(existing, data);
    return this.sourceRepo.save(existing);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.sourceRepo.delete({ id });
    return (result.affected ?? 0) > 0;
  }
}
