import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CtiInvestigation } from './entities/cti-investigation.entity';
import { CtiAsset } from './entities/cti-asset.entity';
import { CtiTarget } from './entities/cti-target.entity';
import { CtiPage } from './entities/cti-page.entity';

@Injectable()
export class CtiInvestigationsService {
  constructor(
    @InjectRepository(CtiInvestigation)
    private readonly investigationRepository: Repository<CtiInvestigation>,
    @InjectRepository(CtiAsset)
    private readonly assetRepository: Repository<CtiAsset>,
    @InjectRepository(CtiTarget)
    private readonly targetRepository: Repository<CtiTarget>,
    @InjectRepository(CtiPage)
    private readonly pageRepository: Repository<CtiPage>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    workspaceId: string,
    query: string,
    ctiTargetId?: string,
  ): Promise<CtiInvestigation> {
    // Validate target exists if provided
    if (ctiTargetId) {
      const target = await this.targetRepository.findOne({
        where: { id: ctiTargetId, workspaceId },
      });
      if (!target) {
        throw new NotFoundException('CTI Target not found');
      }
    }

    const investigation = this.investigationRepository.create({
      workspaceId,
      query,
      ctiTargetId: ctiTargetId ?? undefined,
      status: 'pending',
      startedAt: new Date(),
    });
    const saved = await this.investigationRepository.save(investigation) as CtiInvestigation;

    // Emit event so dispatch service can trigger a Pensieve scan
    this.eventEmitter.emit('cti-investigation.create', {
      investigation: saved,
      workspaceId,
    });

    return saved;
  }

  async findAll(
    workspaceId: string,
    page = 1,
    pageSize = 20,
  ): Promise<{ items: CtiInvestigation[]; total: number }> {
    const [items, total] = await this.investigationRepository.findAndCount({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      relations: ['ctiTarget'],
    });
    return { items, total };
  }

  async findOne(id: string, workspaceId: string): Promise<CtiInvestigation> {
    const investigation = await this.investigationRepository.findOne({
      where: { id, workspaceId },
      relations: ['ctiTarget'],
    });
    if (!investigation) {
      throw new NotFoundException(`CTI Investigation ${id} not found`);
    }
    return investigation;
  }

  async findOneWithEntities(
    id: string,
    workspaceId: string,
    page = 1,
    pageSize = 50,
  ): Promise<any> {
    const investigation = await this.findOne(id, workspaceId);

    // Get assets discovered during this investigation
    // Assets are linked via the ctiTargetId + time window
    let assetsQuery = this.assetRepository
      .createQueryBuilder('asset')
      .where('asset.workspaceId = :workspaceId', { workspaceId })
      .orderBy('asset.threatScore', 'DESC')
      .addOrderBy('asset.lastSeenAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (investigation.ctiTargetId) {
      assetsQuery = assetsQuery.andWhere(
        'asset.ctiTargetId = :targetId',
        { targetId: investigation.ctiTargetId },
      );
    }

    // If investigation has time bounds, filter assets within that window
    if (investigation.startedAt && investigation.completedAt) {
      assetsQuery = assetsQuery.andWhere(
        'asset.firstSeenAt BETWEEN :start AND :end',
        { start: investigation.startedAt, end: investigation.completedAt },
      );
    }

    const [entities, totalEntities] = await assetsQuery.getManyAndCount();

    // Get findings from this investigation via cti_findings
    const findings = await this.investigationRepository.manager.query(
      `SELECT id, name, severity, description, tags, "matchedAt", category, source, "firstSeenAt" as "createdAt"
       FROM cti_findings
       WHERE "workspaceId" = $1
         AND "firstSeenAt" >= COALESCE($2, '1970-01-01'::timestamptz)
         AND "firstSeenAt" <= COALESCE($3, now())
         AND (name ILIKE $4 OR description ILIKE $4 OR "matchedAt" ILIKE $4)
       ORDER BY "firstSeenAt" DESC
       LIMIT 50`,
      [
        workspaceId,
        investigation.startedAt,
        investigation.completedAt,
        `%${investigation.query}%`,
      ],
    );

    return {
      ...investigation,
      entities,
      totalEntities,
      findings,
    };
  }

  async getPages(id: string, workspaceId: string): Promise<CtiPage[]> {
    await this.findOne(id, workspaceId);
    return this.pageRepository.find({
      where: { ctiInvestigationId: id, workspaceId },
      order: { createdAt: 'ASC' },
    });
  }

  async getTimeline(id: string, workspaceId: string): Promise<any> {
    const inv = await this.findOne(id, workspaceId);
    const pipelineSteps = [
      'Query refinement',
      'Seed URL loading',
      'Dark web search',
      'Threat feed enrichment',
      'Content extraction',
      'Entity extraction',
      'Enrichment (VT, HIBP, etc)',
      'Graph construction',
      'Community detection',
      'AI Summary',
    ];

    const totalSteps = (inv as any).totalSteps ?? 10;
    const currentStep = (inv as any).currentStep ?? 0;

    return {
      status: inv.status,
      currentStep,
      totalSteps,
      steps: pipelineSteps.slice(0, totalSteps).map((label, i) => ({
        step: i,
        label,
        status: i < currentStep ? 'completed' : i === currentStep && inv.status !== 'completed' ? 'running' : i < currentStep ? 'completed' : 'pending',
        completed: i < currentStep || inv.status === 'completed',
      })),
    };
  }

  async getSummary(id: string, workspaceId: string): Promise<any> {
    const inv = await this.findOne(id, workspaceId);
    return {
      query: inv.query,
      refinedQuery: (inv as any).refinedQuery,
      summary: (inv as any).summary,
      modelUsed: (inv as any).modelUsed,
      sourcesUsed: (inv as any).sourcesUsed ?? {},
      entityCount: inv.entityCount,
      relationshipCount: (inv as any).relationshipCount ?? 0,
      pageCount: (inv as any).pageCount ?? 0,
      graphStatus: (inv as any).graphStatus ?? 'unknown',
      communities: (inv as any).communities ?? {},
    };
  }
  async getProgress(id: string, workspaceId: string) {
    const inv = await this.investigationRepository.findOne({
      where: { id, workspaceId },
    });
    if (!inv) throw new NotFoundException();
    return {
      current_step: (inv as any).currentStep ?? 0,
      current_step_label: (inv as any).currentStepLabel ?? '',
      total_steps: (inv as any).totalSteps ?? 10,
      status: inv.status,
      entity_count: (inv as any).entityCount ?? 0,
    };
  }

  async cancel(id: string, workspaceId: string) {
    const inv = await this.investigationRepository.findOne({ where: { id, workspaceId } });
    if (!inv) throw new NotFoundException();
    (inv as any).status = 'cancelled';
    await this.investigationRepository.save(inv);
    return { cancelled: true };
  }
}