import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CtiTarget } from '../../cti/entities/cti-target.entity';
import { CtiAsset } from '../../cti/entities/cti-asset.entity';
import type { CtiReportData } from '../types/cti-report-data.type';

@Injectable()
export class CtiReportService {
  constructor(
    @InjectRepository(CtiTarget)
    private readonly targetRepo: Repository<CtiTarget>,
    @InjectRepository(CtiAsset)
    private readonly assetRepo: Repository<CtiAsset>,
  ) {}

  async getCtiReportData(
    workspaceId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<CtiReportData> {
    const now = new Date();

    // Count targets
    const targets = await this.targetRepo.find({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
    });

    // Get all assets
    const assetQb = this.assetRepo
      .createQueryBuilder('asset')
      .where('asset.workspaceId = :workspaceId', { workspaceId });

    if (options?.startDate) {
      assetQb.andWhere('asset.firstSeenAt >= :start', {
        start: options.startDate,
      });
    }
    if (options?.endDate) {
      assetQb.andWhere('asset.firstSeenAt <= :end', {
        end: options.endDate,
      });
    }

    const assets = await assetQb
      .orderBy('asset.threatScore', 'DESC')
      .getMany();

    const totalAssets = assets.length;
    const criticalThreats = assets.filter(
      (a) => (a.threatScore ?? 0) >= 80,
    ).length;
    const avgThreatScore =
      totalAssets > 0
        ? Math.round(
            assets.reduce((sum, a) => sum + (a.threatScore ?? 0), 0) /
              totalAssets,
          )
        : 0;

    // Count findings
    const findingResult = await this.targetRepo.manager.query(
      `SELECT COUNT(*) as count FROM vulnerabilities
       WHERE "workspaceId" = $1 AND tags @> ARRAY['pensieve']`,
      [workspaceId],
    );
    const totalFindings = parseInt(findingResult[0]?.count ?? '0', 10);

    // Threat distribution
    const threatBuckets = [
      { level: 'Critical (80-100)', min: 80, max: 101 },
      { level: 'High (60-79)', min: 60, max: 80 },
      { level: 'Medium (40-59)', min: 40, max: 60 },
      { level: 'Low (20-39)', min: 20, max: 40 },
      { level: 'Info (0-19)', min: 0, max: 20 },
    ];

    const threatDistribution = threatBuckets.map((bucket) => {
      const count = assets.filter(
        (a) =>
          (a.threatScore ?? 0) >= bucket.min &&
          (a.threatScore ?? 0) < bucket.max,
      ).length;
      return {
        level: bucket.level,
        count,
        percent: totalAssets > 0 ? Math.round((count / totalAssets) * 100) : 0,
      };
    });

    // Assets by type
    const typeMap = new Map<string, number>();
    for (const a of assets) {
      typeMap.set(a.type, (typeMap.get(a.type) ?? 0) + 1);
    }
    const assetsByType = Array.from(typeMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // Top threats (highest score)
    const topThreats = assets.slice(0, 20).map((a) => ({
      id: a.id,
      value: a.value,
      type: a.type,
      threatScore: a.threatScore ?? 0,
      confidence: a.confidence ?? 0,
      source: a.source,
      firstSeenAt: a.firstSeenAt?.toISOString() ?? a.createdAt.toISOString(),
      lastSeenAt: a.lastSeenAt?.toISOString() ?? a.updatedAt.toISOString(),
    }));

    // Target summaries
    const targetSummaries = await Promise.all(
      targets.slice(0, 50).map(async (t) => {
        const assetCount = await this.assetRepo.count({
          where: { ctiTargetId: t.id, workspaceId },
        });
        const maxScore = await this.assetRepo
          .createQueryBuilder('a')
          .select('MAX(a.threatScore)', 'max')
          .where('a.ctiTargetId = :id', { id: t.id })
          .getRawOne();

        return {
          id: t.id,
          value: t.value,
          type: t.type,
          assetCount,
          findingCount: 0,
          highestThreatScore: parseInt(maxScore?.max ?? '0', 10),
          lastScanAt: t.lastScanAt?.toISOString() ?? null,
        };
      }),
    );

    // Recent critical assets (last 30 days, score >= 60)
    const recentCritical = assets
      .filter((a) => (a.threatScore ?? 0) >= 60)
      .slice(0, 30)
      .map((a) => ({
        id: a.id,
        value: a.value,
        type: a.type,
        threatScore: a.threatScore ?? 0,
        confidence: a.confidence ?? 0,
        source: a.source,
        firstSeenAt: a.firstSeenAt?.toISOString() ?? a.createdAt.toISOString(),
        lastSeenAt: a.lastSeenAt?.toISOString() ?? a.updatedAt.toISOString(),
      }));

    return {
      reportTitle: 'CTI Intelligence Report',
      exportedAt: now.toISOString(),
      workspaceName: '',
      classification: 'Strictly Confidential',
      systemName: 'Open Attack Surface Management',
      dateRange: options?.startDate
        ? `${options.startDate.toISOString().slice(0, 10)} — ${(options.endDate ?? now).toISOString().slice(0, 10)}`
        : undefined,

      totalTargets: targets.length,
      totalAssets,
      totalFindings,
      criticalThreats,
      avgThreatScore,

      threatDistribution,
      assetsByType,
      topThreats,
      targets: targetSummaries,
      recentCritical,
    };
  }
}
