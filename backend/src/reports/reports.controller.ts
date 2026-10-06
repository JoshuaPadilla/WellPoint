import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UsePipes,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { createReportSchema, patchReportStatusSchema } from '../common/schemas';
import { CommunityReport } from '../entities/community-report.entity';

@Controller('api/reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  findAll(): Promise<CommunityReport[]> {
    return this.reports.findAll();
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createReportSchema))
  create(@Body() body: unknown): Promise<CommunityReport> {
    return this.reports.create(body as never);
  }

  @Patch(':id/status')
  @UsePipes(new ZodValidationPipe(patchReportStatusSchema))
  updateStatus(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<CommunityReport> {
    return this.reports.updateStatus(id, body as never);
  }
}
