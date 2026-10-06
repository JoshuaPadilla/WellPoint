import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/interface/authenticated-user.interface';
import { Permissions } from '../../../common/rbac/permissions.decorator';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../../guards/permission.guard';
import { AlertsService } from '../services/alerts.service';

@Controller('alerts')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @Permissions('alert:read', 'alert:read:own')
  async get(@CurrentUser() user: AuthenticatedUser) {
    const alerts = await this.alertsService.deriveAll();
    return user.barangayId
      ? alerts.filter((a) => a.psgcCode === user.barangayId)
      : alerts;
  }
}
