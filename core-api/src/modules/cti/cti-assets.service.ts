import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CtiAsset } from './entities/cti-asset.entity';
import { CtiAssetRelation } from './entities/cti-asset-relation.entity';
import { GetCtiAssetsDto } from './dto/get-cti-assets.dto';
import { exportStixBundle } from './export/stix-exporter';
import { exportMispEvent } from './export/misp-exporter';
import { exportYaraRules } from './export/yara-exporter';

@Injectable()
export class CtiAssetsService {
  constructor(
    @InjectRepository(CtiAsset)
    private readonly assetRepository: Repository<CtiAsset>,
    @InjectRepository(CtiAssetRelation)
    private readonly relationRepository: Repository<CtiAssetRelation>,
  ) {}

  async findAll(
    query: GetCtiAssetsDto,
    workspaceId: string,
  ): Promise<{ items: CtiAsset[]; total: number }> {
    const { page = 1, pageSize = 20, type, ctiTargetId } = query;

    const qb = this.assetRepository
      .createQueryBuilder('asset')
      .where('asset.workspaceId = :workspaceId', { workspaceId })
      .orderBy('asset.lastSeenAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (type) {
      qb.andWhere('asset.type = :type', { type });
    }
    if (ctiTargetId) {
      qb.andWhere('asset.ctiTargetId = :ctiTargetId', { ctiTargetId });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findOne(id: string, workspaceId: string): Promise<CtiAsset> {
    const asset = await this.assetRepository.findOne({
      where: { id, workspaceId },
      relations: ['ctiTarget'],
    });
    if (!asset) {
      throw new NotFoundException(`CTI Asset ${id} not found`);
    }
    return asset;
  }

  async getRelations(
    id: string,
    workspaceId: string,
  ): Promise<CtiAssetRelation[]> {
    await this.findOne(id, workspaceId);

    return this.relationRepository
      .createQueryBuilder('rel')
      .leftJoinAndSelect('rel.sourceAsset', 'source')
      .leftJoinAndSelect('rel.targetAsset', 'target')
      .where('(rel.sourceAssetId = :id OR rel.targetAssetId = :id)', { id })
      .getMany();
  }

  async getGraph(
    workspaceId: string,
    rootAssetId?: string,
    depth: number = 2,
  ): Promise<{
    nodes: Array<{
      id: string;
      value: string;
      type: string;
      threatScore: number;
      confidence: number;
      source: string | null;
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
      relationType: string;
      confidence: number;
    }>;
  }> {
    if (rootAssetId) {
      // BFS from root asset
      const visited = new Set<string>();
      const queue: string[] = [rootAssetId];
      visited.add(rootAssetId);

      for (let d = 0; d < depth && queue.length > 0; d++) {
        const batch = [...queue];
        queue.length = 0;

        const rels = await this.relationRepository
          .createQueryBuilder('rel')
          .where(
            '(rel.sourceAssetId IN (:...ids) OR rel.targetAssetId IN (:...ids))',
            { ids: batch },
          )
          .getMany();

        for (const rel of rels) {
          for (const neighbor of [rel.sourceAssetId, rel.targetAssetId]) {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              queue.push(neighbor);
            }
          }
        }
      }

      const nodeIds = Array.from(visited);
      if (nodeIds.length === 0) {
        return { nodes: [], edges: [] };
      }

      const assets = await this.assetRepository
        .createQueryBuilder('a')
        .where('a.id IN (:...ids)', { ids: nodeIds })
        .getMany();

      const edges = await this.relationRepository
        .createQueryBuilder('rel')
        .where(
          'rel.sourceAssetId IN (:...ids) AND rel.targetAssetId IN (:...ids)',
          { ids: nodeIds },
        )
        .getMany();

      return {
        nodes: assets.map((a) => ({
          id: a.id,
          value: a.value,
          type: a.type,
          threatScore: a.threatScore ?? 0,
          confidence: a.confidence ?? 0,
          source: a.source,
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.sourceAssetId,
          target: e.targetAssetId,
          relationType: e.relationType,
          confidence: e.confidence ?? 0,
        })),
      };
    }

    // No root: return all assets + relations (capped at 500 nodes)
    const assets = await this.assetRepository.find({
      where: { workspaceId },
      order: { threatScore: 'DESC' },
      take: 500,
    });

    const assetIds = assets.map((a) => a.id);
    const relations =
      assetIds.length > 0
        ? await this.relationRepository
            .createQueryBuilder('rel')
            .where(
              'rel.sourceAssetId IN (:...ids) AND rel.targetAssetId IN (:...ids)',
              { ids: assetIds },
            )
            .getMany()
        : [];

    return {
      nodes: assets.map((a) => ({
        id: a.id,
        value: a.value,
        type: a.type,
        threatScore: a.threatScore ?? 0,
        confidence: a.confidence ?? 0,
        source: a.source,
      })),
      edges: relations.map((e) => ({
        id: e.id,
        source: e.sourceAssetId,
        target: e.targetAssetId,
        relationType: e.relationType,
        confidence: e.confidence ?? 0,
      })),
    };
  }

  async getAllAssetsAndRelations(workspaceId: string): Promise<{
    assets: CtiAsset[];
    relations: CtiAssetRelation[];
  }> {
    const assets = await this.assetRepository.find({
      where: { workspaceId },
      order: { threatScore: 'DESC' },
      take: 5000,
    });

    const assetIds = assets.map((a) => a.id);
    const relations =
      assetIds.length > 0
        ? await this.relationRepository
            .createQueryBuilder('rel')
            .where('rel.sourceAssetId IN (:...ids)', { ids: assetIds })
            .orWhere('rel.targetAssetId IN (:...ids)', { ids: assetIds })
            .getMany()
        : [];

    return { assets, relations };
  }

  async exportStix(workspaceId: string): Promise<Record<string, unknown>> {
    const { assets, relations } = await this.getAllAssetsAndRelations(workspaceId);
    return exportStixBundle(assets, relations);
  }

  async exportMisp(
    workspaceId: string,
    workspaceName?: string,
  ): Promise<Record<string, unknown>> {
    const { assets, relations } = await this.getAllAssetsAndRelations(workspaceId);
    return exportMispEvent(assets, relations, workspaceName);
  }

  async exportYara(workspaceId: string): Promise<string> {
    const { assets } = await this.getAllAssetsAndRelations(workspaceId);
    return exportYaraRules(assets);
  }

  async getEnrichment(id: string, workspaceId: string): Promise<any> {
    const asset = await this.findOne(id, workspaceId);
    return {
      asset: {
        id: asset.id,
        value: asset.value,
        type: asset.type,
        threatScore: asset.threatScore,
        confidence: asset.confidence,
        priorityScore: (asset as any).priorityScore ?? 0,
        highSignal: (asset as any).highSignal ?? false,
        crossReferenced: (asset as any).crossReferenced ?? false,
        communityId: (asset as any).communityId,
        freshnessTag: (asset as any).freshnessTag,
        contextSnippet: (asset as any).contextSnippet,
        extractionMethod: (asset as any).extractionMethod,
        sourceCount: (asset as any).sourceCount ?? 0,
        canonicalValue: (asset as any).canonicalValue,
      },
      enrichment: (asset as any).enrichmentData ?? {},
      metadata: asset.metadata ?? {},
    };
  }

  async getCommunities(workspaceId: string): Promise<any> {
    const result = await this.assetRepository
      .createQueryBuilder('asset')
      .select(['"communityId"', 'COUNT(*) as count', 'AVG("threatScore") as "avgThreatScore"'])
      .where('"workspaceId" = :workspaceId AND "communityId" IS NOT NULL', { workspaceId })
      .groupBy('"communityId"')
      .orderBy('count', 'DESC')
      .getRawMany();

    // For each community, get top 5 assets
    const communities = [];
    for (const row of result) {
      const topAssets = await this.assetRepository.find({
        where: { workspaceId, communityId: row.communityId },
        order: { threatScore: 'DESC' },
        take: 5,
      });
      communities.push({
        communityId: row.communityId,
        count: parseInt(row.count),
        avgThreatScore: parseFloat(row.avgThreatScore) || 0,
        topAssets: topAssets.map(a => ({
          id: a.id,
          value: a.value,
          type: a.type,
          threatScore: a.threatScore,
        })),
      });
    }

    return { communities, total: communities.length };
  }

  async getStats(workspaceId: string): Promise<any> {
    // Total counts
    const totalAssets = await this.assetRepository.count({ where: { workspaceId } });
    const totalRelations = await this.relationRepository.count({ where: { workspaceId } });

    // By type
    const byType = await this.assetRepository
      .createQueryBuilder('a')
      .select(['a.type as type', 'COUNT(*) as count'])
      .where('"workspaceId" = :workspaceId', { workspaceId })
      .groupBy('a.type')
      .orderBy('count', 'DESC')
      .getRawMany();

    // Severity distribution (threat score buckets)
    const severityDist = await this.assetRepository
      .createQueryBuilder('a')
      .select([
        `CASE
           WHEN "threatScore" >= 80 THEN 'critical'
           WHEN "threatScore" >= 60 THEN 'high'
           WHEN "threatScore" >= 40 THEN 'medium'
           WHEN "threatScore" >= 20 THEN 'low'
           ELSE 'info'
         END as severity`,
        'COUNT(*) as count',
      ])
      .where('"workspaceId" = :workspaceId', { workspaceId })
      .groupBy('severity')
      .getRawMany();

    // High signal count
    const highSignalCount = await this.assetRepository.count({
      where: { workspaceId, highSignal: true } as any,
    });

    // Top threats
    const topThreats = await this.assetRepository.find({
      where: { workspaceId },
      order: { threatScore: 'DESC' },
      take: 10,
    });

    // Source distribution
    const bySrc = await this.assetRepository
      .createQueryBuilder('a')
      .select(['a.source as source', 'COUNT(*) as count'])
      .where('"workspaceId" = :workspaceId', { workspaceId })
      .groupBy('a.source')
      .orderBy('count', 'DESC')
      .take(10)
      .getRawMany();

    return {
      totalAssets,
      totalRelations,
      highSignalCount,
      byType: byType.map(r => ({ type: r.type, count: parseInt(r.count) })),
      severityDistribution: severityDist.map(r => ({ severity: r.severity, count: parseInt(r.count) })),
      topThreats: topThreats.map(a => ({
        id: a.id, value: a.value, type: a.type,
        threatScore: a.threatScore, source: a.source,
      })),
      bySource: bySrc.map(r => ({ source: r.source, count: parseInt(r.count) })),
    };
  }

  async exportCsv(workspaceId: string): Promise<string> {
    const assets = await this.assetRepository.find({
      where: { workspaceId },
      order: { threatScore: 'DESC' },
    });

    const headers = ['value', 'type', 'threatScore', 'confidence', 'source', 'firstSeenAt', 'lastSeenAt', 'highSignal', 'crossReferenced', 'communityId'];
    const rows = assets.map(a => [
      `"${(a.value || '').replace(/"/g, '""')}"`,
      a.type,
      a.threatScore,
      a.confidence,
      `"${(a.source || '').replace(/"/g, '""')}"`,
      a.firstSeenAt?.toISOString() ?? '',
      a.lastSeenAt?.toISOString() ?? '',
      (a as any).highSignal ?? false,
      (a as any).crossReferenced ?? false,
      (a as any).communityId ?? '',
    ].join(','));

    return [headers.join(','), ...rows].join('\n');
  }

  async exportSigma(workspaceId: string): Promise<string> {
    const assets = await this.assetRepository.find({
      where: { workspaceId },
      order: { threatScore: 'DESC' },
      take: 500,
    });

    const ips = assets.filter(a => a.type === 'IP').map(a => a.value);
    const domains = assets.filter(a => a.type === 'DOMAIN').map(a => a.value);
    const hashes = assets.filter(a => a.type === 'FILE_HASH').map(a => a.value);

    const rules: string[] = [];
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '/');

    if (ips.length > 0) {
      rules.push(`title: Pensieve CTI - Malicious IP Connections
id: pensieve-cti-ip-${Date.now()}
status: experimental
description: Detects connections to known malicious IPs from CTI intelligence
date: ${date}
logsource:
    category: firewall
detection:
    selection:
        dst_ip:
${ips.map(ip => '            - ' + ip).join('\n')}
    condition: selection
level: high
tags:
    - attack.command_and_control`);
    }

    if (domains.length > 0) {
      rules.push(`title: Pensieve CTI - Malicious Domain Queries
id: pensieve-cti-domain-${Date.now()}
status: experimental
description: Detects DNS queries to known malicious domains from CTI intelligence
date: ${date}
logsource:
    category: dns
detection:
    selection:
        query:
${domains.map(d => '            - ' + d).join('\n')}
    condition: selection
level: high
tags:
    - attack.command_and_control`);
    }

    if (hashes.length > 0) {
      rules.push(`title: Pensieve CTI - Malicious File Hashes
id: pensieve-cti-hash-${Date.now()}
status: experimental
description: Detects files matching known malicious hashes from CTI intelligence
date: ${date}
logsource:
    category: file_event
detection:
    selection:
        Hashes|contains:
${hashes.map(h => '            - ' + h).join('\n')}
    condition: selection
level: critical
tags:
    - attack.execution`);
    }

    return rules.join('\n---\n') || '# No applicable assets for Sigma rules';
  }

  async exportSnort(workspaceId: string): Promise<string> {
    const assets = await this.assetRepository.find({
      where: { workspaceId },
      order: { threatScore: 'DESC' },
      take: 500,
    });

    const rules: string[] = [];
    let sid = 9000001;

    rules.push('# Pensieve CTI - Auto-generated Snort/Suricata rules');
    rules.push(`# Generated: ${new Date().toISOString()}`);
    rules.push('');

    for (const asset of assets) {
      if (asset.type === 'IP') {
        rules.push(`alert ip any any -> ${asset.value} any (msg:"Pensieve CTI: Malicious IP ${asset.value}"; sid:${sid++}; rev:1; classtype:trojan-activity;)`);
      } else if (asset.type === 'DOMAIN') {
        rules.push(`alert dns any any -> any any (msg:"Pensieve CTI: Malicious Domain ${asset.value}"; dns.query; content:"${asset.value}"; sid:${sid++}; rev:1; classtype:trojan-activity;)`);
      }
    }

    return rules.join('\n') || '# No applicable assets for Snort rules';
  }
}
