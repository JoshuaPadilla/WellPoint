import { Controller, Get } from '@nestjs/common';
import { MetricsService, MetricsView } from './metrics.service';

@Controller('api/metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  get(): Promise<MetricsView> {
    return this.metrics.compute();
  }
}
