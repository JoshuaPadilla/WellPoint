import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Permissions } from '../common/rbac/permissions.decorator';
import { SourcesService } from './sources.service';
import type { CreateSourceDto } from './sources.service';

const SOURCE_TYPES = ['spring', 'river', 'groundwater', 'reservoir'];

@Controller('sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get()
  @Permissions('source:read')
  findAll() {
    return this.sourcesService.findAll();
  }

  @Get('barangay/:psgc')
  @Permissions('source:read')
  findByBarangay(@Param('psgc') psgc: string) {
    return this.sourcesService.findByBarangay(psgc);
  }

  @Post()
  @Permissions('source:create')
  async create(@Body() body: CreateSourceDto) {
    this.validate(body);
    return this.sourcesService.create(body);
  }

  @Patch(':id')
  @Permissions('source:update')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<CreateSourceDto>,
  ) {
    this.validate(body);
    const updated = await this.sourcesService.update(id, body);
    if (!updated) throw new NotFoundException('Source not found');
    return updated;
  }

  @Delete(':id')
  @Permissions('source:delete')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const removed = await this.sourcesService.remove(id);
    if (!removed) throw new NotFoundException('Source not found');
    return { ok: true };
  }

  private validate(body: Partial<CreateSourceDto>) {
    if (body.type !== undefined && !SOURCE_TYPES.includes(body.type)) {
      throw new BadRequestException(
        `type must be one of: ${SOURCE_TYPES.join(', ')}`,
      );
    }
    if (body.capacity !== undefined && Number.isNaN(body.capacity)) {
      throw new BadRequestException('capacity must be a number');
    }
  }
}
