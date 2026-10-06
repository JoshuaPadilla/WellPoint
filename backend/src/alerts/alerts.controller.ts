import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertsService } from '../alerts/alerts.service';
import { Alert } from '../entities/alert.entity';

@Controller('api/alerts')
export class AlertsController {
  constructor(
    private readonly alerts: AlertsService,
    @InjectRepository(Alert) private readonly alertRepo: Repository<Alert>,
  ) {}

  @Get()
  list(): Promise<Alert[]> {
    return this.alerts.findAll();
  }
}
