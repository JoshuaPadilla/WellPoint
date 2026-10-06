import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Community } from '../../../entities/community.entity';
import { CommunityReport } from '../../../entities/community-report.entity';
import { Repository } from 'typeorm';
import type { RequestUser } from '../../../common/interface/authenticated-user.interface';
import type { CommunityReportDto } from '../../../schemas/domain.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(CommunityReport)
    private readonly reportRepo: Repository<CommunityReport>,
    @InjectRepository(Community)
    private readonly communityRepo: Repository<Community>,
  ) {}

  async create(
    user: RequestUser,
    dto: { type: string; description: string },
  ): Promise<CommunityReportDto> {
    const psgc = user.barangayId;
    if (!psgc) {
      throw new BadRequestException(
        'A report must be tied to a barangay scope.',
      );
    }
    const community = await this.communityRepo.findOne({
      where: { psgcCode: psgc },
    });
    if (!community) {
      throw new BadRequestException('Unknown barangay scope.');
    }

    const report = this.reportRepo.create({
      reporter: user.name || user.email,
      area: community.name,
      psgcCode: community.psgcCode,
      communityId: community.id,
      type: dto.type,
      description: dto.description,
      status: 'new',
    });
    await this.reportRepo.save(report);
    return toReportDto(report);
  }

  async list(scopePsgc?: string | null): Promise<CommunityReportDto[]> {
    const reports = await this.reportRepo.find({
      order: { createdAt: 'DESC' },
    });
    return reports
      .filter((r) => (scopePsgc ? r.psgcCode === scopePsgc : true))
      .map(toReportDto);
  }

  async transition(
    id: string,
    status: 'acknowledged' | 'resolved',
  ): Promise<CommunityReportDto> {
    const report = await this.reportRepo.findOne({ where: { id } });
    if (!report) {
      throw new NotFoundException('Report not found.');
    }
    report.status = status;
    await this.reportRepo.save(report);
    return toReportDto(report);
  }
}

export function toReportDto(r: CommunityReport): CommunityReportDto {
  return {
    id: r.id,
    reporter: r.reporter,
    area: r.area,
    psgcCode: r.psgcCode,
    type: r.type as CommunityReportDto['type'],
    description: r.description,
    status: r.status as CommunityReportDto['status'],
    createdAt: r.createdAt.toISOString(),
  };
}
