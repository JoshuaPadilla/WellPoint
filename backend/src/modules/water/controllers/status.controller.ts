import { Controller, Get, UseGuards } from '@nestjs/common';
import { Permissions } from '../../../common/rbac/permissions.decorator';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../../guards/permission.guard';
import { ReadModelsService } from '../services/read-models.service';

@Controller('status')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class StatusController {
  constructor(private readonly readModels: ReadModelsService) {}

  @Get()
  @Permissions('dashboard:read')
  get() {
    return this.readModels.listStatus();
  }
}
