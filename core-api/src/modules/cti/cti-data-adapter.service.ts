import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto';
import { CtiFinding } from './entities/cti-finding.entity';
import { CtiAsset } from './entities/cti-asset.entity';
import { CtiAssetRelation } from './entities/cti-asset-relation.entity';
import { CtiTarget } from './entities/cti-target.entity';
import { Job } from '@/modules/jobs-registry/entities/job.entity';

/** Connector-reported vulnerability shape (from proto). */
interface ConnectorFinding {
  name: string;
  description?: string;
  severity?: string;
  tags?: string[];
  references?: string[];
  matchedAt?: string;
  fingerprint?: string;
  [key: string]: unknown;
}

const VALID_SEVERITIES = new Set(['critical', 'high', 'medium', 'low', 'info']);
const CATEGORY_TAG_MAP: Record<string, string> = {
  'darkweb': 'darkweb',
  'dark-web': 'darkweb',
  'dark_web': 'darkweb',
  'data-leak': 'data-leak',
  'data-leaks': 'data-leak',
  'leak': 'data-leak',
  'brand-protection': 'brand-protection',
  'domain-squatting': 'brand-protection',
  'phishing': 'brand-protection',
  'typosquat': 'brand-protection',
  'ioc': 'ioc',
  'ioc-feed': 'ioc',
  'abuse': 'ioc',
  'fraud': 'fraud',
  'stealer': 'fraud',
  'sanctions': 'sanctions',
  'ransomware': 'darkweb',
  'social': 'social',
  'twitter': 'social',
  'telegram': 'social',
  'crypto': 'crypto',
  'opensquat': 'brand-protection',
  'pensieve': 'darkweb',
};

/**
 * CTI Data Adapter — the Threat Intelligence counterpart of DataAdapterService.
 *
 * Receives connector findings for CTI jobs (where job.asset is null) and
 * writes them to cti_findings + cti_assets instead of the ASM vulnerabilities table.
 */
@Injectable()
export class CtiDataAdapterService {
  private readonly logger = new Logger(CtiDataAdapterService.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Sync connector findings for a CTI job.
   * Routes findings to cti_findings table and extracts entities to cti_assets.
   */
  async syncFindings(job: Job, data: ConnectorFinding[]): Promise<void> {
    if (!data || data.length === 0) {
      this.logger.log(`No findings to sync for CTI job ${job.id}`);
      return;
    }

    const workspaceId = this.resolveWorkspaceId(job);
    if (!workspaceId) {
      this.logger.warn(`No workspaceId for CTI job ${job.id}, skipping`);
      return;
    }

    const ctiTargetId = await this.resolveCtiTargetId(job, workspaceId);
    if (!ctiTargetId) {
      this.logger.warn(`No CTI target found for job ${job.id}, skipping`);
      return;
    }

    const toolId = job.tool?.id ?? undefined;
    const jobHistoryId = job.jobHistory?.id ?? undefined;

    await this.dataSource.transaction(async (manager) => {
      const now = new Date();
      const values = data.map((finding) => {
        const severity = normalizeSeverity(finding.severity);
        const tags = finding.tags ?? [];
        const category = this.inferCategory(tags);
        const fp = finding.fingerprint
          ? ctiFingerprint(ctiTargetId, toolId, finding.fingerprint)
          : ctiFingerprint(ctiTargetId, toolId, finding.name + (finding.matchedAt ?? ''));

        return {
          workspaceId,
          ctiTargetId,
          name: finding.name ?? 'Unknown',
          description: finding.description ?? undefined,
          severity,
          category,
          matchedAt: finding.matchedAt ?? undefined,
          tags,
          references: finding.references ?? [],
          source: tags.find((t: string) => !['pensieve', category].includes(t)) ?? 'pensieve',
          fingerprint: fp,
          toolId,
          jobHistoryId,
          confidence: typeof finding.confidence === 'number' ? finding.confidence : undefined,
          threatScore: typeof finding.threatScore === 'number' ? finding.threatScore : undefined,
          firstSeenAt: now,
          lastSeenAt: now,
          timesDetected: 1,
          metadata: this.extractMetadata(finding),
        };
      });

      // Deduplicate by fingerprint
      const unique = Array.from(
        new Map(values.map((v) => [v.fingerprint, v])).values(),
      );

      // Upsert in chunks
      const CHUNK = 500;
      let totalUpserted = 0;
      for (let i = 0; i < unique.length; i += CHUNK) {
        const chunk = unique.slice(i, i + CHUNK);
        const result = await manager
          .createQueryBuilder()
          .insert()
          .into(CtiFinding)
          .values(chunk)
          .onConflict(
            `("fingerprint") DO UPDATE SET
             "lastSeenAt" = EXCLUDED."lastSeenAt",
             "timesDetected" = "cti_findings"."timesDetected" + 1,
             "severity" = CASE WHEN EXCLUDED."severity" != 'info' THEN EXCLUDED."severity" ELSE "cti_findings"."severity" END,
             "description" = COALESCE(EXCLUDED."description", "cti_findings"."description"),
             "metadata" = "cti_findings"."metadata" || EXCLUDED."metadata",
             "updatedAt" = now()`,
          )
          .execute();
        totalUpserted += result.identifiers?.length ?? chunk.length;
      }

      this.logger.log(
        `CTI job ${job.id}: synced ${totalUpserted} findings (${unique.length} unique) for target ${ctiTargetId}`,
      );

      // Extract entities → cti_assets
      await this.extractAssets(manager, unique, workspaceId, ctiTargetId);
    });

    // Update lastScanAt on the target
    await this.dataSource
      .getRepository(CtiTarget)
      .update({ id: ctiTargetId }, { lastScanAt: new Date() });
  }

  private resolveWorkspaceId(job: Job): string | null {
    // CTI jobs carry _workspaceId in inputs
    if (job.inputs?.['_workspaceId']) return job.inputs['_workspaceId'];
    // Fallback: job may have workspaceId through jobHistory
    return null;
  }

  private async resolveCtiTargetId(
    job: Job,
    workspaceId: string,
  ): Promise<string | null> {
    // Try to find the CTI target by value + type from job inputs
    const targetValue = job.inputs?.['target'];
    const targetType = job.inputs?.['ctiTargetType'];
    if (!targetValue || !targetType) return null;

    const target = await this.dataSource.getRepository(CtiTarget).findOne({
      where: { workspaceId, value: targetValue, type: targetType },
    });
    return target?.id ?? null;
  }

  private inferCategory(tags: string[]): string {
    for (const tag of tags) {
      const lower = tag.toLowerCase();
      if (CATEGORY_TAG_MAP[lower]) return CATEGORY_TAG_MAP[lower];
    }
    return 'darkweb'; // default for VoidAccess findings
  }

  private extractMetadata(finding: ConnectorFinding): Record<string, any> {
    const meta: Record<string, any> = {};
    // Carry over interesting fields that aren't in the main columns
    for (const key of ['affectedUrl', 'ipAddress', 'host', 'cvssScore', 'cveId', 'solution', 'extractedResults']) {
      if (finding[key] !== undefined && finding[key] !== null) {
        meta[key] = finding[key];
      }
    }
    return meta;
  }

  /**
   * Extract entity-like findings into cti_assets for graph/enrichment.
   * E.g., IP addresses, domains, hashes, emails found as matchedAt values.
   */
  private async extractAssets(
    manager: any,
    findings: any[],
    workspaceId: string,
    ctiTargetId: string,
  ): Promise<void> {
    const assetMap = new Map<string, { value: string; type: string; source: string; threatScore: number }>();

    for (const f of findings) {
      if (!f.matchedAt) continue;
      const value = f.matchedAt;
      const type = this.inferAssetType(value);
      if (!type) continue;

      const key = `${type}:${value}`;
      if (!assetMap.has(key)) {
        assetMap.set(key, {
          value,
          type,
          source: f.source ?? 'pensieve',
          threatScore: this.severityToScore(f.severity),
        });
      }
    }

    if (assetMap.size === 0) return;

    const assets = Array.from(assetMap.values()).map((a) => ({
      workspaceId,
      ctiTargetId,
      value: a.value,
      type: a.type,
      source: a.source,
      threatScore: a.threatScore,
      confidence: 0.5,
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
      isActive: true,
      metadata: {},
    }));

    // Upsert — update lastSeenAt on conflict
    const CHUNK = 200;
    for (let i = 0; i < assets.length; i += CHUNK) {
      const chunk = assets.slice(i, i + CHUNK);
      await manager
        .createQueryBuilder()
        .insert()
        .into(CtiAsset)
        .values(chunk)
        .onConflict(
          `("workspaceId", "ctiTargetId", "value", "type") DO UPDATE SET
           "lastSeenAt" = EXCLUDED."lastSeenAt",
           "threatScore" = GREATEST("cti_assets"."threatScore", EXCLUDED."threatScore"),
           "updatedAt" = now()`,
        )
        .execute();
    }

    this.logger.log(`Extracted ${assetMap.size} entities to cti_assets`);
  }

  private inferAssetType(value: string): string | null {
    if (!value) return null;
    // IP
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(value)) return 'IP';
    // Email
    if (/^[^@]+@[^@]+\.[^@]+$/.test(value)) return 'EMAIL';
    // Hash (SHA256, MD5, SHA1)
    if (/^[a-fA-F0-9]{64}$/.test(value)) return 'FILE_HASH';
    if (/^[a-fA-F0-9]{40}$/.test(value)) return 'FILE_HASH';
    if (/^[a-fA-F0-9]{32}$/.test(value)) return 'FILE_HASH';
    // CVE
    if (/^CVE-\d{4}-\d+$/i.test(value)) return 'CVE';
    // Onion
    if (/\.onion$/.test(value)) return 'ONION';
    // URL
    if (/^https?:\/\//.test(value)) return 'URL';
    // Domain (basic)
    if (/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/.test(value)) return 'DOMAIN';
    return null;
  }

  private severityToScore(severity: string): number {
    switch (severity) {
      case 'critical': return 90;
      case 'high': return 70;
      case 'medium': return 50;
      case 'low': return 30;
      default: return 10;
    }
  }
}

function normalizeSeverity(value: unknown): string {
  const lower = typeof value === 'string' ? value.toLowerCase() : '';
  return VALID_SEVERITIES.has(lower) ? lower : 'info';
}

function ctiFingerprint(ctiTargetId: string, toolId: string | null | undefined, source: string): string {
  return crypto
    .createHash('sha256')
    .update(`cti:${ctiTargetId}:${toolId ?? 'unknown'}:${source}`)
    .digest('hex');
}
