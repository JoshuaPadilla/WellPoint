import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { Permissions } from '../../../common/rbac/permissions.decorator';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../../guards/permission.guard';
import { SimulateSchema } from '../../../schemas/domain.schema';
import type { DisruptionType } from '../../../entities/enums';
import { DemoService } from '../services/demo.service';

@Controller('demo')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @Post('simulate')
  @Permissions('demo:simulate')
  simulate(
    @Body(new ZodValidationPipe(SimulateSchema))
    dto: {
      type: DisruptionType;
      targetSystemId?: string;
    },
  ) {
    return this.demoService.simulate(dto);
  }

  @Post('reset')
  @Permissions('demo:reset')
  reset() {
    return this.demoService.reset();
  }
}
