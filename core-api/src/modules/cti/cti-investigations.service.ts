import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CtiInvestigation } from './entities/cti-investigation.entity';
import { CtiAsset } from './entities/cti-asset.entity';

@Injectable()
export class CtiInvestigationsService {
  constructor(
    @InjectRepository(CtiInvestigation)
    private readonly investigationRepository: Repository<CtiInvestigation>,
    @InjectRepository(CtiAsset)
    private readonly assetRepository: Repository<CtiAsset>,
  ) {}

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

    // Get findings from this investigation via vulnerabilities
    const findings = await this.investigationRepository.manager.query(
      `SELECT id, name, severity, description, tags, "matchedAt", "createdAt"
       FROM vulnerabilities
       WHERE "workspaceId" = $1
         AND tags @> ARRAY['pensieve']
         AND "createdAt" >= COALESCE($2, '1970-01-01'::timestamptz)
         AND "createdAt" <= COALESCE($3, now())
         AND ("matchedAt" ILIKE $4 OR description ILIKE $4)
       ORDER BY "createdAt" DESC
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
}
