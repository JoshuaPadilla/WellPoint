import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunityReport } from '../entities/community-report.entity';
import { CreateReportDto, PatchReportStatusDto } from '../common/schemas';
import { AlertsService } from '../alerts/alerts.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(CommunityReport)
    private readonly reportRepo: Repository<CommunityReport>,
    private readonly alerts: AlertsService,
  ) {}

  async findAll(): Promise<CommunityReport[]> {
    return this.reportRepo.find({ order: { createdAt: 'DESC' } });
  }

  async create(dto: CreateReportDto): Promise<CommunityReport> {
    const report = await this.reportRepo.save({
      reporter: 'Barangay Official',
      area: dto.area,
      type: dto.type,
      description: dto.description,
      status: 'new',
      createdAt: new Date(),
    });
    await this.alerts.derive();
    return report;
  }

  async updateStatus(
    id: string,
    dto: PatchReportStatusDto,
  ): Promise<CommunityReport> {
    const report = await this.reportRepo.findOne({ where: { id } });
    if (!report) throw new NotFoundException(`Report ${id} not found`);
    report.status = dto.status;
    const saved = await this.reportRepo.save(report);
    await this.alerts.derive();
    return saved;
  }
}
