import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/interface/authenticated-user.interface';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { Permissions } from '../../../common/rbac/permissions.decorator';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../../guards/permission.guard';
import { CreateReportSchema } from '../../../schemas/domain.schema';
import { ReportsService } from '../services/reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('report:read', 'report:read:own')
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.list(user.barangayId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('report:create')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateReportSchema))
    dto: { type: string; description: string },
  ) {
    return this.reportsService.create(user, dto);
  }

  @Post(':id/ack')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('report:ack')
  ack(@Param('id') id: string) {
    return this.reportsService.transition(id, 'acknowledged');
  }

  @Post(':id/resolve')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('report:resolve')
  resolve(@Param('id') id: string) {
    return this.reportsService.transition(id, 'resolved');
  }
}
