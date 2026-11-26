import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CtiMonitor } from './entities/cti-monitor.entity';
import { CtiMonitorAlert } from './entities/cti-monitor-alert.entity';

@Injectable()
export class CtiMonitorsService {
  constructor(
    @InjectRepository(CtiMonitor)
    private readonly monitorRepo: Repository<CtiMonitor>,
    @InjectRepository(CtiMonitorAlert)
    private readonly alertRepo: Repository<CtiMonitorAlert>,
  ) {}

  async create(workspaceId: string, dto: { name: string; query: string; interval?: string; deliveryChannels?: Record<string, any> }) {
    const monitor = this.monitorRepo.create({
      workspaceId,
      name: dto.name,
      query: dto.query,
      interval: dto.interval ?? 'daily',
      deliveryChannels: dto.deliveryChannels ?? {},
      lastSnapshot: {},
    });
    return this.monitorRepo.save(monitor);
  }

  async list(workspaceId: string) {
    return this.monitorRepo.find({ where: { workspaceId }, order: { createdAt: 'DESC' } });
  }

  async remove(id: string, workspaceId: string) {
    const monitor = await this.monitorRepo.findOne({ where: { id, workspaceId } });
    if (!monitor) throw new NotFoundException();
    await this.monitorRepo.remove(monitor);
    return { success: true };
  }

  async getAlerts(id: string, workspaceId: string, limit = 20) {
    const monitor = await this.monitorRepo.findOne({ where: { id, workspaceId } });
    if (!monitor) throw new NotFoundException();
    return this.alertRepo.find({
      where: { monitorId: id },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async recordAlert(monitorId: string, workspaceId: string, alert: { changeType: string; summary: string; diffData: any; entityCountDelta: number; severity?: string }) {
    const a = this.alertRepo.create({
      monitorId,
      workspaceId,
      changeType: alert.changeType,
      summary: alert.summary,
      diffData: alert.diffData,
      entityCountDelta: alert.entityCountDelta,
      severity: alert.severity ?? 'info',
    });
    return this.alertRepo.save(a);
  }
}
