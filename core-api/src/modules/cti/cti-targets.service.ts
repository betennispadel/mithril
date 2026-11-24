import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CtiTarget } from './entities/cti-target.entity';
import { CtiAsset } from './entities/cti-asset.entity';
import { CreateCtiTargetDto, CreateCtiTargetsBulkDto } from './dto/create-cti-target.dto';
import { GetCtiTargetsDto } from './dto/get-cti-targets.dto';
import { UpdateCtiTargetDto } from './dto/update-cti-target.dto';
import { EventBridgeService } from '@/modules/event-bridge/publishing/event-bridge.service';
import { EVENT_CATALOG } from '@/modules/event-bridge/contracts/event-catalog';

@Injectable()
export class CtiTargetsService {
  constructor(
    @InjectRepository(CtiTarget)
    private readonly targetRepository: Repository<CtiTarget>,
    @InjectRepository(CtiAsset)
    private readonly assetRepository: Repository<CtiAsset>,
    private readonly eventEmitter: EventEmitter2,
    private readonly eventBridge: EventBridgeService,
  ) {}

  async create(
    dto: CreateCtiTargetDto,
    workspaceId: string,
  ): Promise<CtiTarget> {
    const target = this.targetRepository.create({
      ...dto,
      workspaceId,
    });
    const saved = await this.targetRepository.save(target);
    this.eventEmitter.emit('cti-target.create', {
      target: saved,
      workspaceId,
    });

    // Publish to event bridge for notifications + integrations
    await this.eventBridge.publishSafely(
      EVENT_CATALOG.cti_target.created,
      {
        targetId: saved.id,
        targetValue: saved.value,
        targetType: saved.type,
      },
      { subject: workspaceId },
    );

    return saved;
  }

  async discover(
    dto: CreateCtiTargetsBulkDto,
    workspaceId: string,
  ): Promise<CtiTarget[]> {
    const results: CtiTarget[] = [];

    for (const item of dto.targets) {
      const existing = await this.targetRepository.findOne({
        where: { workspaceId, value: item.value, type: item.type },
      });

      if (existing) {
        results.push(existing);
        this.eventEmitter.emit('cti-target.re-scan', {
          target: existing,
          workspaceId,
        });
        continue;
      }

      const target = this.targetRepository.create({
        ...item,
        workspaceId,
      });
      const saved = await this.targetRepository.save(target);
      results.push(saved);
      this.eventEmitter.emit('cti-target.create', {
        target: saved,
        workspaceId,
      });
    }

    return results;
  }

  async findAll(
    query: GetCtiTargetsDto,
    workspaceId: string,
  ): Promise<{ items: CtiTarget[]; total: number }> {
    const { page = 1, pageSize = 20, type } = query;

    const qb = this.targetRepository
      .createQueryBuilder('target')
      .where('target.workspaceId = :workspaceId', { workspaceId })
      .orderBy('target.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (type) {
      qb.andWhere('target.type = :type', { type });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findOne(id: string, workspaceId: string): Promise<CtiTarget> {
    const target = await this.targetRepository.findOne({
      where: { id, workspaceId },
    });
    if (!target) {
      throw new NotFoundException(`CTI Target ${id} not found`);
    }
    return target;
  }

  async findOneWithStats(id: string, workspaceId: string): Promise<any> {
    const target = await this.findOne(id, workspaceId);

    // Count assets by type
    const assetStats = await this.assetRepository
      .createQueryBuilder('asset')
      .select('asset.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('asset.ctiTargetId = :id', { id })
      .groupBy('asset.type')
      .getRawMany();

    const totalAssets = assetStats.reduce((sum, s) => sum + parseInt(s.count, 10), 0);

    // Count findings from cti_findings table
    const findingStats = await this.targetRepository.manager.query(
      `SELECT severity, COUNT(*) as count
       FROM cti_findings
       WHERE "workspaceId" = $1
         AND "ctiTargetId" = $2
       GROUP BY severity`,
      [workspaceId, id],
    );

    const totalFindings = findingStats.reduce(
      (sum: number, s: any) => sum + parseInt(s.count, 10),
      0,
    );

    // Count investigations
    const investigationCount = await this.targetRepository.manager.query(
      `SELECT COUNT(*) as count FROM cti_investigations
       WHERE "ctiTargetId" = $1`,
      [id],
    );

    return {
      ...target,
      stats: {
        totalAssets,
        assetsByType: assetStats,
        totalFindings,
        findingsBySeverity: findingStats,
        totalInvestigations: parseInt(investigationCount[0]?.count ?? '0', 10),
      },
    };
  }

  async getTargetFindings(
    id: string,
    workspaceId: string,
    page = 1,
    pageSize = 20,
  ): Promise<{ items: any[]; total: number }> {
    const target = await this.findOne(id, workspaceId);

    const [items, total]: [any[], any[]] = await Promise.all([
      this.targetRepository.manager.query(
        `SELECT id, name, severity, description, tags, "matchedAt", category, source, "firstSeenAt" as "createdAt"
         FROM cti_findings
         WHERE "workspaceId" = $1
           AND "ctiTargetId" = $2
         ORDER BY "firstSeenAt" DESC
         LIMIT $3 OFFSET $4`,
        [workspaceId, id, pageSize, (page - 1) * pageSize],
      ),
      this.targetRepository.manager.query(
        `SELECT COUNT(*) as count
         FROM cti_findings
         WHERE "workspaceId" = $1
           AND "ctiTargetId" = $2`,
        [workspaceId, id],
      ),
    ]);

    return { items, total: parseInt(total[0]?.count ?? '0', 10) };
  }

  async update(
    id: string,
    dto: UpdateCtiTargetDto,
    workspaceId: string,
  ): Promise<CtiTarget> {
    const target = await this.findOne(id, workspaceId);
    Object.assign(target, dto);
    return this.targetRepository.save(target);
  }

  async remove(id: string, workspaceId: string): Promise<void> {
    const target = await this.findOne(id, workspaceId);
    await this.targetRepository.remove(target);
  }

  async rescan(id: string, workspaceId: string): Promise<CtiTarget> {
    const target = await this.findOne(id, workspaceId);
    this.eventEmitter.emit('cti-target.re-scan', {
      target,
      workspaceId,
    });
    return target;
  }

  async getDashboardStats(workspaceId: string): Promise<Record<string, unknown>> {
    // Target stats
    const [targets, totalTargets] = await this.targetRepository.findAndCount({
      where: { workspaceId },
    });
    const activeTargets = targets.filter((t) => t.isEnabled).length;

    // Asset stats
    const assetStats = await this.assetRepository
      .createQueryBuilder('a')
      .select('a.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(a.threatScore)', 'avgScore')
      .addSelect('MAX(a.threatScore)', 'maxScore')
      .where('a.workspaceId = :workspaceId', { workspaceId })
      .groupBy('a.type')
      .getRawMany();

    const totalAssets = assetStats.reduce(
      (sum, s) => sum + parseInt(s.count, 10),
      0,
    );

    // Threat score distribution
    const threatDist = await this.assetRepository
      .createQueryBuilder('a')
      .select(
        `CASE
          WHEN a."threatScore" >= 80 THEN 'critical'
          WHEN a."threatScore" >= 60 THEN 'high'
          WHEN a."threatScore" >= 40 THEN 'medium'
          WHEN a."threatScore" >= 20 THEN 'low'
          ELSE 'info'
        END`,
        'level',
      )
      .addSelect('COUNT(*)', 'count')
      .where('a.workspaceId = :workspaceId', { workspaceId })
      .groupBy('level')
      .getRawMany();

    // Finding stats from cti_findings table
    const findingStats = await this.targetRepository.manager.query(
      `SELECT severity, COUNT(*) as count
       FROM cti_findings
       WHERE "workspaceId" = $1
       GROUP BY severity`,
      [workspaceId],
    );
    const totalFindings = findingStats.reduce(
      (sum: number, s: any) => sum + parseInt(s.count, 10),
      0,
    );

    // Recent assets (last 7 days)
    const recentAssets = await this.assetRepository
      .createQueryBuilder('a')
      .where('a.workspaceId = :workspaceId', { workspaceId })
      .andWhere('a."firstSeenAt" >= NOW() - INTERVAL \'7 days\'')
      .orderBy('a."threatScore"', 'DESC')
      .take(10)
      .getMany();

    // Top threat actors
    const topThreats = await this.assetRepository
      .createQueryBuilder('a')
      .where('a.workspaceId = :workspaceId', { workspaceId })
      .andWhere('a."threatScore" >= 60')
      .orderBy('a."threatScore"', 'DESC')
      .take(10)
      .getMany();

    // Scan activity (last 30 days)
    const scanActivity = await this.targetRepository
      .createQueryBuilder('t')
      .select('DATE(t."lastScanAt")', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('t.workspaceId = :workspaceId', { workspaceId })
      .andWhere('t."lastScanAt" IS NOT NULL')
      .andWhere('t."lastScanAt" >= NOW() - INTERVAL \'30 days\'')
      .groupBy('DATE(t."lastScanAt")')
      .orderBy('date', 'ASC')
      .getRawMany();

    return {
      totalTargets,
      activeTargets,
      totalAssets,
      totalFindings,
      assetsByType: assetStats,
      threatDistribution: threatDist,
      findingsBySeverity: findingStats,
      recentAssets,
      topThreats,
      scanActivity,
    };
  }

  /**
   * Called by the data-adapter or job completion handler after a Pensieve scan
   * finishes. Publishes events to the event bridge so both in-app notifications
   * and integration pushes (Slack/Discord/Telegram/Webhook) fire automatically.
   */
  async onScanCompleted(
    targetId: string,
    workspaceId: string,
    results: { newAssets: number; totalFindings: number; highestThreatScore: number },
  ): Promise<void> {
    const target = await this.findOne(targetId, workspaceId);

    // Update lastScanAt
    target.lastScanAt = new Date();
    await this.targetRepository.save(target);

    // Publish scan completed event
    await this.eventBridge.publishSafely(
      EVENT_CATALOG.cti_target.scanned,
      {
        targetId: target.id,
        targetValue: target.value,
        targetType: target.type,
        newAssets: results.newAssets,
        totalFindings: results.totalFindings,
        highestThreatScore: results.highestThreatScore,
      },
      { subject: workspaceId },
    );

    // If highest threat score is critical (>=80), emit threat detected
    if (results.highestThreatScore >= 80) {
      const topAsset = await this.assetRepository.findOne({
        where: { ctiTargetId: target.id, workspaceId },
        order: { threatScore: 'DESC' },
      });

      if (topAsset) {
        await this.eventBridge.publishSafely(
          EVENT_CATALOG.cti.threat_detected,
          {
            targetId: target.id,
            targetValue: target.value,
            assetValue: topAsset.value,
            assetType: topAsset.type,
            threatScore: topAsset.threatScore,
            source: topAsset.source ?? 'pensieve',
          },
          { subject: workspaceId },
        );
      }
    }
  }

  /**
   * Called when an investigation finishes. Publishes event to the bridge.
   */
  async onInvestigationCompleted(
    investigationId: string,
    workspaceId: string,
    results: { query: string; entityCount: number; findingCount: number; targetId?: string },
  ): Promise<void> {
    await this.eventBridge.publishSafely(
      EVENT_CATALOG.cti.investigation.completed,
      {
        investigationId,
        query: results.query,
        entityCount: results.entityCount,
        findingCount: results.findingCount,
        targetId: results.targetId,
      },
      { subject: workspaceId },
    );
  }
}
