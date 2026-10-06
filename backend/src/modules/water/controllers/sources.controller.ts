import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/interface/authenticated-user.interface';
import { Permissions } from '../../../common/rbac/permissions.decorator';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../../guards/permission.guard';
import { ReadModelsService } from '../services/read-models.service';

@Controller('sources')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class SourcesController {
  constructor(private readonly readModels: ReadModelsService) {}

  @Get()
  @Permissions('source:read', 'source:read:own')
  get(@CurrentUser() user: AuthenticatedUser) {
    return this.readModels.listSources(user.barangayId);
  }
}
