import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto';
import { CtiFinding } from './entities/cti-finding.entity';
import { CtiAsset } from './entities/cti-asset.entity';
import { CtiAssetRelation } from './entities/cti-asset-relation.entity';
import { CtiTarget } from './entities/cti-target.entity';
import { CtiInvestigation } from './entities/cti-investigation.entity';
import { CtiPage } from './entities/cti-page.entity';
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

/** VoidAccess structured result (embedded as JSON in __pensieve_structured_result__ finding). */
interface VoidAccessGraph {
  nodes: Record<string, any>[];
  edges: Record<string, any>[];
  communities: Record<string, number>;
  node_count: number;
  edge_count: number;
}

interface VoidAccessResult {
  investigation: VoidAccessInvestigation;
  entities: VoidAccessEntity[];
  relationships: VoidAccessRelationship[];
  pages: VoidAccessPage[];
  graph?: VoidAccessGraph;
}

interface VoidAccessInvestigation {
  id: string;
  run_id?: string;
  status: string;
  query: string;
  refined_query?: string;
  model_used?: string;
  summary?: string;
  current_step?: number;
  current_step_label?: string;
  total_steps?: number;
  entity_count?: number;
  relationship_count?: number;
  page_count?: number;
  graph_status?: string;
  sources_used?: Record<string, any>;
  communities?: Record<string, number>;
  created_at?: string;
}

interface VoidAccessEntity {
  id: string;
  entity_type: string;
  value: string;
  canonical_value?: string;
  confidence?: number;
  context_snippet?: string;
  historical_context?: string;
  extraction_method?: string;
  source_count?: number;
  investigation_count?: number;
  cross_referenced?: boolean;
  corroborating_sources?: any;
  source_url?: string;
  source_quality?: number;
  first_seen?: string;
  last_seen?: string;
  priority_score?: number;
  high_signal?: boolean;
  freshness_tag?: string;
  rank?: number;
  suppressed?: boolean;
  threat_score?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

interface VoidAccessRelationship {
  id?: string;
  entity_a_id: string;
  entity_b_id: string;
  relationship_type: string;
  confidence?: number;
  source_page_id?: string;
  source_url?: string;
  first_seen?: string;
}

interface VoidAccessPage {
  id?: string;
  url: string;
  source?: string;
  language?: string;
  byte_size?: number;
}

/** Entity type mapping from VoidAccess types to our normalized types */
const VA_TYPE_MAP: Record<string, string> = {
  'ip_address': 'IP', 'ip': 'IP', 'ipv4': 'IP', 'ipv6': 'IP',
  'domain': 'DOMAIN', 'domain_name': 'DOMAIN',
  'email': 'EMAIL', 'email_address': 'EMAIL',
  'cve': 'CVE', 'cve_number': 'CVE',
  'malware': 'MALWARE', 'malware_family': 'MALWARE',
  'threat_actor': 'THREAT_ACTOR', 'threat_actor_handle': 'THREAT_ACTOR', 'actor_alias': 'THREAT_ACTOR',
  'ransomware_group': 'RANSOMWARE_GROUP',
  'mitre_technique': 'MITRE_TECHNIQUE',
  'organization_name': 'ORGANIZATION', 'organization': 'ORGANIZATION',
  'url': 'URL',
  'file_hash': 'FILE_HASH', 'hash': 'FILE_HASH',
  'hash_md5': 'FILE_HASH', 'hash_sha1': 'FILE_HASH', 'hash_sha256': 'FILE_HASH', 'hash_sha512': 'FILE_HASH',
  'cryptocurrency_address': 'CRYPTO_WALLET', 'crypto_wallet': 'CRYPTO_WALLET',
  'btc_address': 'CRYPTO_WALLET', 'eth_address': 'CRYPTO_WALLET', 'monero_address': 'CRYPTO_WALLET',
  'telegram_username': 'TELEGRAM_CHANNEL',
};

/** Relationship type mapping from VoidAccess to our types */
const VA_REL_MAP: Record<string, string> = {
  'CO_APPEARED_ON': 'co-appeared',
  'POSTED_BY': 'posted-by',
  'LINKED_TO': 'linked-to',
  'PAID_TO': 'funded-by',
  'MEMBER_OF': 'member-of',
  'USES': 'uses',
  'CLAIMED': 'claimed',
  'LIKELY_SAME_ACTOR': 'likely-same-actor',
  'CONFIRMED_SAME_ACTOR': 'confirmed-same-actor',
  'FUNDED_BY': 'funded-by',
  'TARGETS': 'targets',
  'EXPLOITS': 'exploits',
  'COMMUNICATES_WITH': 'communicates-with',
  'DROPS': 'drops',
  'CONTROLS': 'controls',
  'RESOLVES_TO': 'resolves-to',
  'HOSTS': 'hosts',
  'BELONGS_TO': 'belongs-to',
  'DISTRIBUTES': 'distributes',
};

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

    // Mark target as actively scanning
    await this.dataSource.getRepository('cti_targets').update(ctiTargetId, { scanStatus: 'scanning' });

    const toolId = job.tool?.id ?? undefined;
    const jobHistoryId = job.jobHistory?.id ?? undefined;

    // ── Extract structured VoidAccess result if present ──
    const structuredIdx = data.findIndex(f => f.name === '__pensieve_structured_result__');
    let structuredResult: VoidAccessResult | null = null;
    if (structuredIdx >= 0) {
      try {
        structuredResult = JSON.parse(data[structuredIdx].description ?? '');
        this.logger.log(`CTI job ${job.id}: parsed structured VoidAccess result (${structuredResult?.entities?.length ?? 0} entities, ${structuredResult?.relationships?.length ?? 0} relationships)`);
      } catch (e) {
        this.logger.warn(`CTI job ${job.id}: failed to parse structured result: ${e}`);
      }
      data.splice(structuredIdx, 1); // remove from normal findings
    }

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

      // Extract entities → cti_assets (from non-structured findings)
      await this.extractAssets(manager, unique, workspaceId, ctiTargetId);

      // ── Sync VoidAccess structured data directly to tables ──
      if (structuredResult) {
        await this.syncVoidAccessEntities(manager, structuredResult, workspaceId, ctiTargetId);
        await this.syncVoidAccessRelationships(manager, structuredResult, workspaceId, ctiTargetId);
        await this.syncVoidAccessPages(manager, structuredResult, workspaceId, ctiTargetId);
        await this.syncVoidAccessInvestigation(manager, structuredResult, workspaceId, ctiTargetId, job);
      }
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
  private extractCandidateValues(f: { name?: string; description?: string; matchedAt?: string }): string[] {
    const candidates: string[] = [];

    // 1. matchedAt (primary)
    if (f.matchedAt) candidates.push(f.matchedAt);

    const name = f.name ?? '';
    const desc = f.description ?? '';
    const combined = name + ' ' + desc;

    // 2. "Typosquat: domain.com" or "Brand: domain.com"
    const colonMatch = name.match(/^[A-Za-z -]+:\s*(.+)$/);
    if (colonMatch) candidates.push(colonMatch[1].trim());

    // 3. CVE patterns
    const cves = combined.match(/CVE-\d{4}-\d{4,}/gi);
    if (cves) candidates.push(...cves);

    // 4. IP addresses
    const ips = combined.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g);
    if (ips) candidates.push(...ips);

    // 5. "Entity 'VALUE'" from VoidAccess descriptions
    const entityMatches = desc.match(/Entity '([^']+)'/g);
    if (entityMatches) {
      for (const m of entityMatches) {
        const inner = m.match(/Entity '([^']+)'/);
        if (inner) candidates.push(inner[1]);
      }
    }

    // 6. URLs from description
    const urls = combined.match(/https?:\/\/[^\s"'<>]+/g);
    if (urls) candidates.push(...urls);

    // 7. Email addresses
    const emails = combined.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (emails) candidates.push(...emails);

    // 8. Onion addresses
    const onions = combined.match(/[a-z2-7]{16,56}\.onion/gi);
    if (onions) candidates.push(...onions);

    // 9. SHA256 hashes
    const hashes = combined.match(/\b[a-fA-F0-9]{64}\b/g);
    if (hashes) candidates.push(...hashes);

    return [...new Set(candidates)];
  }

  private async extractAssets(
    manager: any,
    findings: any[],
    workspaceId: string,
    ctiTargetId: string,
  ): Promise<void> {
    const assetMap = new Map<string, { value: string; type: string; source: string; threatScore: number }>();

    for (const f of findings) {
      const candidates = this.extractCandidateValues(f);
      for (const value of candidates) {
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

  /**
   * Build relations between assets that co-occur in the same finding.
   * E.g., if a finding mentions both an IP and a domain, link them.
   */
  private async buildAssetRelations(
    manager: any,
    findings: any[],
    workspaceId: string,
    ctiTargetId: string,
  ): Promise<void> {
    // Group assets by finding fingerprint
    const findingAssets = new Map<string, string[]>();
    for (const f of findings) {
      const candidates = this.extractCandidateValues(f);
      const values: string[] = [];
      for (const c of candidates) {
        if (this.inferAssetType(c)) values.push(c);
      }
      if (values.length > 1) {
        findingAssets.set(f.fingerprint, values);
      }
    }

    if (findingAssets.size === 0) return;

    // Fetch all assets for this target to get their IDs
    const existingAssets = await manager
      .createQueryBuilder()
      .select(['id', 'value', 'type'])
      .from('cti_assets', 'a')
      .where('"workspaceId" = :workspaceId AND "ctiTargetId" = :ctiTargetId', {
        workspaceId,
        ctiTargetId,
      })
      .getRawMany();

    const assetIdMap = new Map<string, string>();
    for (const a of existingAssets) {
      assetIdMap.set(`${a.type}:${a.value}`, a.id);
    }

    const relations: Array<{
      workspaceId: string;
      sourceAssetId: string;
      targetAssetId: string;
      relationType: string;
      confidence: number;
      source: string;
    }> = [];

    for (const [, values] of findingAssets) {
      // Create pairwise relations between co-occurring assets
      for (let i = 0; i < values.length; i++) {
        for (let j = i + 1; j < values.length; j++) {
          const typeA = this.inferAssetType(values[i]);
          const typeB = this.inferAssetType(values[j]);
          if (!typeA || !typeB) continue;

          const idA = assetIdMap.get(`${typeA}:${values[i]}`);
          const idB = assetIdMap.get(`${typeB}:${values[j]}`);
          if (!idA || !idB || idA === idB) continue;

          const relationType = this.inferRelationType(typeA, typeB);
          relations.push({
            workspaceId,
            sourceAssetId: idA,
            targetAssetId: idB,
            relationType,
            confidence: 0.6,
            source: 'pensieve',
          });
        }
      }
    }

    if (relations.length === 0) return;

    // Deduplicate
    const unique = Array.from(
      new Map(
        relations.map((r) => [`${r.sourceAssetId}:${r.targetAssetId}:${r.relationType}`, r]),
      ).values(),
    );

    const CHUNK = 200;
    for (let i = 0; i < unique.length; i += CHUNK) {
      const chunk = unique.slice(i, i + CHUNK);
      await manager
        .createQueryBuilder()
        .insert()
        .into('cti_asset_relations')
        .values(chunk)
        .onConflict(
          `("sourceAssetId", "targetAssetId", "relationType") DO UPDATE SET
           confidence = GREATEST("cti_asset_relations".confidence, EXCLUDED.confidence),
           "updatedAt" = now()`,
        )
        .execute();
    }

    this.logger.log(`Built ${unique.length} asset relations`);
  }

  private inferRelationType(typeA: string, typeB: string): string {
    const pair = [typeA, typeB].sort().join(':');
    const map: Record<string, string> = {
      'DOMAIN:IP': 'resolves-to',
      'CVE:DOMAIN': 'affects',
      'CVE:IP': 'affects',
      'DOMAIN:URL': 'hosts',
      'EMAIL:DOMAIN': 'belongs-to',
      'DOMAIN:FILE_HASH': 'distributes',
      'IP:FILE_HASH': 'distributes',
      'IP:URL': 'hosts',
    };
    return map[pair] ?? 'related-to';
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

  // ── VoidAccess Structured Data Sync Methods ──────────────────────────────

  /**
   * Sync VoidAccess entities directly to cti_assets with full structured data.
   * This is much richer than the regex-based extractAssets method.
   */
  private async syncVoidAccessEntities(
    manager: any,
    result: VoidAccessResult,
    workspaceId: string,
    ctiTargetId: string,
  ): Promise<void> {
    const entities = (result.entities ?? []).filter(e => !e.suppressed && e.value);
    if (entities.length === 0) return;

    const now = new Date();
    const assets = entities.map(e => {
      const type = VA_TYPE_MAP[e.entity_type?.toLowerCase()] ?? e.entity_type?.toUpperCase() ?? 'UNKNOWN';
      // IOC freshness decay: >90 days -> 0.7x, >180 days -> 0.4x
      let confidence = e.confidence ?? 0.5;
      if (e.last_seen) {
        const daysSince = (Date.now() - new Date(e.last_seen).getTime()) / 86400000;
        if (daysSince > 180) confidence *= 0.4;
        else if (daysSince > 90) confidence *= 0.7;
      }
      return {
        workspaceId,
        ctiTargetId,
        value: e.value,
        type,
        confidence,
        threatScore: e.threat_score ?? Math.round(e.priority_score ?? 0),
        source: e.source_url ?? 'voidaccess',
        firstSeenAt: e.first_seen ? new Date(e.first_seen) : now,
        lastSeenAt: e.last_seen ? new Date(e.last_seen) : now,
        isActive: true,
        canonicalValue: e.canonical_value ?? null,
        contextSnippet: e.context_snippet ?? null,
        extractionMethod: e.extraction_method ?? null,
        sourceCount: e.source_count ?? 0,
        highSignal: e.high_signal ?? false,
        crossReferenced: e.cross_referenced ?? false,
        freshnessTag: e.freshness_tag ?? null,
        priorityScore: e.priority_score ?? 0,
        communityId: result.investigation?.communities?.[e.id] ?? null,
        enrichmentData: e.metadata ?? {},
        metadata: {
          voidAccessId: e.id,
          historicalContext: e.historical_context,
          rank: e.rank,
          tags: e.tags,
          corroboratingSources: e.corroborating_sources,
          sourceQuality: e.source_quality,
        },
      };
    });

    // Upsert in chunks
    const CHUNK = 200;
    let total = 0;
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
           "confidence" = GREATEST("cti_assets"."confidence", EXCLUDED."confidence"),
           "canonicalValue" = COALESCE(EXCLUDED."canonicalValue", "cti_assets"."canonicalValue"),
           "contextSnippet" = COALESCE(EXCLUDED."contextSnippet", "cti_assets"."contextSnippet"),
           "extractionMethod" = COALESCE(EXCLUDED."extractionMethod", "cti_assets"."extractionMethod"),
           "sourceCount" = GREATEST("cti_assets"."sourceCount", EXCLUDED."sourceCount"),
           "highSignal" = EXCLUDED."highSignal" OR "cti_assets"."highSignal",
           "crossReferenced" = EXCLUDED."crossReferenced" OR "cti_assets"."crossReferenced",
           "freshnessTag" = COALESCE(EXCLUDED."freshnessTag", "cti_assets"."freshnessTag"),
           "priorityScore" = GREATEST("cti_assets"."priorityScore", EXCLUDED."priorityScore"),
           "communityId" = COALESCE(EXCLUDED."communityId", "cti_assets"."communityId"),
           "enrichmentData" = "cti_assets"."enrichmentData" || EXCLUDED."enrichmentData",
           "metadata" = "cti_assets"."metadata" || EXCLUDED."metadata",
           "updatedAt" = now()`,
        )
        .execute();
      total += chunk.length;
    }

    this.logger.log(`VoidAccess: synced ${total} structured entities to cti_assets`);
  }

  /**
   * Sync VoidAccess relationships to cti_asset_relations.
   */
  private async syncVoidAccessRelationships(
    manager: any,
    result: VoidAccessResult,
    workspaceId: string,
    ctiTargetId: string,
  ): Promise<void> {
    const rels = result.relationships ?? [];
    if (rels.length === 0) return;

    // Build VoidAccess entity ID → asset value+type map
    const vaEntityMap = new Map<string, { value: string; type: string }>();
    for (const e of result.entities ?? []) {
      const type = VA_TYPE_MAP[e.entity_type?.toLowerCase()] ?? e.entity_type?.toUpperCase() ?? 'UNKNOWN';
      vaEntityMap.set(e.id, { value: e.value, type });
    }

    // Fetch existing assets to get their DB IDs
    const existingAssets = await manager
      .createQueryBuilder()
      .select(['"id"', '"value"', '"type"'])
      .from('cti_assets', 'a')
      .where('"workspaceId" = :workspaceId AND "ctiTargetId" = :ctiTargetId', {
        workspaceId,
        ctiTargetId,
      })
      .getRawMany();

    const assetIdMap = new Map<string, string>();
    for (const a of existingAssets) {
      assetIdMap.set(`${a.type}:${a.value}`, a.id);
    }

    const relations: Array<{
      workspaceId: string;
      sourceAssetId: string;
      targetAssetId: string;
      relationType: string;
      confidence: number;
      source: string;
    }> = [];

    for (const rel of rels) {
      const src = vaEntityMap.get(rel.entity_a_id);
      const tgt = vaEntityMap.get(rel.entity_b_id);
      if (!src || !tgt) continue;

      const srcId = assetIdMap.get(`${src.type}:${src.value}`);
      const tgtId = assetIdMap.get(`${tgt.type}:${tgt.value}`);
      if (!srcId || !tgtId || srcId === tgtId) continue;

      const relationType = VA_REL_MAP[rel.relationship_type] ?? rel.relationship_type?.toLowerCase() ?? 'related-to';

      relations.push({
        workspaceId,
        sourceAssetId: srcId,
        targetAssetId: tgtId,
        relationType,
        confidence: rel.confidence ?? 0.5,
        source: rel.source_url ?? 'voidaccess',
      });
    }

    if (relations.length === 0) return;

    // Deduplicate
    const unique = Array.from(
      new Map(relations.map(r => [`${r.sourceAssetId}:${r.targetAssetId}:${r.relationType}`, r])).values(),
    );

    const CHUNK = 200;
    for (let i = 0; i < unique.length; i += CHUNK) {
      const chunk = unique.slice(i, i + CHUNK);
      await manager
        .createQueryBuilder()
        .insert()
        .into('cti_asset_relations')
        .values(chunk)
        .onConflict(
          `("sourceAssetId", "targetAssetId", "relationType") DO UPDATE SET
           confidence = GREATEST("cti_asset_relations".confidence, EXCLUDED.confidence),
           "updatedAt" = now()`,
        )
        .execute();
    }

    this.logger.log(`VoidAccess: synced ${unique.length} relationships to cti_asset_relations`);
  }

  /**
   * Sync VoidAccess scraped pages to cti_pages.
   */
  private async syncVoidAccessPages(
    manager: any,
    result: VoidAccessResult,
    workspaceId: string,
    ctiTargetId: string,
  ): Promise<void> {
    const pages = (result.pages ?? []).filter(p => p.url);
    if (pages.length === 0) return;

    // Find or create investigation for this target
    const investigation = await manager.getRepository(CtiInvestigation).findOne({
      where: { workspaceId, ctiTargetId },
      order: { createdAt: 'DESC' },
    });
    if (!investigation) return;

    const pageEntries = pages.map(p => ({
      workspaceId,
      ctiInvestigationId: investigation.id,
      url: p.url,
      source: p.source ?? null,
      language: p.language ?? null,
      byteSize: p.byte_size ?? 0,
    }));

    const CHUNK = 100;
    for (let i = 0; i < pageEntries.length; i += CHUNK) {
      const chunk = pageEntries.slice(i, i + CHUNK);
      await manager
        .createQueryBuilder()
        .insert()
        .into(CtiPage)
        .values(chunk)
        .onConflict(`("ctiInvestigationId", "url") DO NOTHING`)
        .execute();
    }

    this.logger.log(`VoidAccess: synced ${pageEntries.length} pages to cti_pages`);
  }

  /**
   * Update the cti_investigation record with VoidAccess metadata.
   */
  private async syncVoidAccessInvestigation(
    manager: any,
    result: VoidAccessResult,
    workspaceId: string,
    ctiTargetId: string,
    job: Job,
  ): Promise<void> {
    const inv = result.investigation;
    if (!inv) return;

    // Find the most recent investigation for this target
    const existing = await manager.getRepository(CtiInvestigation).findOne({
      where: { workspaceId, ctiTargetId },
      order: { createdAt: 'DESC' },
    });

    const updateData = {
      status: 'completed',
      entityCount: result.entities?.length ?? inv.entity_count ?? 0,
      refinedQuery: inv.refined_query ?? null,
      summary: inv.summary ?? null,
      modelUsed: inv.model_used ?? null,
      sourcesUsed: inv.sources_used ?? {},
      pageCount: result.pages?.length ?? inv.page_count ?? 0,
      graphStatus: inv.graph_status ?? 'completed',
      communities: inv.communities ?? {},
      currentStep: inv.total_steps ?? 10,
      currentStepLabel: 'completed',
      totalSteps: inv.total_steps ?? 10,
      relationshipCount: result.relationships?.length ?? inv.relationship_count ?? 0,
      completedAt: new Date(),
    };

    if (existing) {
      await manager.getRepository(CtiInvestigation).update(existing.id, updateData);
      this.logger.log(`VoidAccess: updated investigation ${existing.id} with structured metadata`);
    } else {
      // Create a new investigation record
      await manager.getRepository(CtiInvestigation).save({
        workspaceId,
        ctiTargetId,
        query: inv.query,
        jobId: job.id,
        startedAt: inv.created_at ? new Date(inv.created_at) : new Date(),
        ...updateData,
        metadata: {
          voidAccessId: inv.id,
          voidAccessRunId: inv.run_id,
        },
      });
      this.logger.log(`VoidAccess: created investigation record for target ${ctiTargetId}`);
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
