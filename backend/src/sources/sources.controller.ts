import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WaterSource } from '../entities/water-source.entity';

@Controller('api/sources')
export class SourcesController {
  constructor(
    @InjectRepository(WaterSource)
    private readonly sourceRepo: Repository<WaterSource>,
  ) {}

  @Get()
  list(): Promise<WaterSource[]> {
    return this.sourceRepo.find();
  }
}
