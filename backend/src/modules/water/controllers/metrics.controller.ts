import { Controller, Get, UseGuards } from '@nestjs/common';
import { Permissions } from '../../../common/rbac/permissions.decorator';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../../guards/permission.guard';
import { MetricsService } from '../services/metrics.service';

@Controller('metrics')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Permissions('dashboard:read')
  get() {
    return this.metricsService.derive();
  }
}
