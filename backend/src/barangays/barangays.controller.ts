import { Controller, Get, Param } from '@nestjs/common';
import {
  BarangaysService,
  BarangayView,
  BarangayDetailView,
} from './barangays.service';

@Controller('api/barangays')
export class BarangaysController {
  constructor(private readonly barangays: BarangaysService) {}

  @Get()
  list(): Promise<BarangayView[]> {
    return this.barangays.listAll();
  }

  @Get(':id')
  detail(@Param('id') id: string): Promise<BarangayDetailView> {
    return this.barangays.detail(id);
  }
}
