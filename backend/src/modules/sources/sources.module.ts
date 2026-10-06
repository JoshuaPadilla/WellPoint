import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaterSource } from './water-source.entity';
import { SourcesController } from './sources.controller';
import { SourcesService } from './sources.service';

@Module({
  imports: [TypeOrmModule.forFeature([WaterSource])],
  controllers: [SourcesController],
  providers: [SourcesService],
})
export class SourcesModule {}
