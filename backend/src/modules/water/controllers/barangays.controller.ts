import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/interface/authenticated-user.interface';
import { Permissions } from '../../../common/rbac/permissions.decorator';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../../guards/permission.guard';
import { ReadModelsService } from '../services/read-models.service';

@Controller('barangays')
export class BarangaysController {
  constructor(private readonly readModels: ReadModelsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('barangay:read', 'barangay:read:own')
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.readModels.listBarangays(user.barangayId);
  }

  @Get('public')
  publicList() {
    return this.readModels.listPublicBarangays();
  }

  @Get(':id/public')
  async publicStatus(@Param('id') id: string) {
    const status = await this.readModels.publicStatus(id);
    if (!status) {
      throw new NotFoundException('Barangay not found.');
    }
    return status;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('barangay:read', 'barangay:read:own')
  async detail(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const detail = await this.readModels.barangayDetail(id);
    if (!detail) {
      throw new NotFoundException('Barangay not found.');
    }
    if (user.barangayId && detail.community.psgcCode !== user.barangayId) {
      throw new ForbiddenException('You can only view your own barangay.');
    }
    return detail;
  }
}
