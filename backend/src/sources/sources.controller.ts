import { Controller, Get, Param } from '@nestjs/common';
import { SourcesService } from './sources.service';

@Controller('sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get()
  findAll() {
    return this.sourcesService.findAll();
  }

  @Get('barangay/:psgc')
  findByBarangay(@Param('psgc') psgc: string) {
    return this.sourcesService.findByBarangay(psgc);
  }
}
