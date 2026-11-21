import { CtiAsset } from '../entities/cti-asset.entity';
import { CtiAssetRelation } from '../entities/cti-asset-relation.entity';

/**
 * Maps CTI asset types to MISP attribute types.
 */
const MISP_TYPE_MAP: Record<string, string> = {
  DOMAIN: 'domain',
  IP: 'ip-dst',
  URL: 'url',
  EMAIL: 'email',
  FILE_HASH: 'sha256',
  CRYPTO_WALLET: 'btc',
  THREAT_ACTOR: 'threat-actor',
  ORGANIZATION: 'target-org',
  CVE: 'vulnerability',
  ASN: 'AS',
  ONION: 'domain',
  USERNAME: 'target-user',
  KEYWORD: 'text',
  PHONE: 'phone-number',
  TELEGRAM_CHANNEL: 'text',
  APP_PACKAGE: 'filename',
};

/**
 * Maps CTI asset types to MISP categories.
 */
const MISP_CATEGORY_MAP: Record<string, string> = {
  DOMAIN: 'Network activity',
  IP: 'Network activity',
  URL: 'Network activity',
  EMAIL: 'Payload delivery',
  FILE_HASH: 'Payload delivery',
  CRYPTO_WALLET: 'Financial fraud',
  THREAT_ACTOR: 'Attribution',
  ORGANIZATION: 'Targeting data',
  CVE: 'External analysis',
  ASN: 'Network activity',
  ONION: 'Network activity',
  USERNAME: 'Targeting data',
  KEYWORD: 'Other',
  PHONE: 'Targeting data',
  TELEGRAM_CHANNEL: 'Other',
  APP_PACKAGE: 'Payload delivery',
};

function threatLevelFromScore(score: number): 1 | 2 | 3 | 4 {
  if (score >= 80) return 1; // High
  if (score >= 60) return 2; // Medium
  if (score >= 40) return 3; // Low
  return 4; // Undefined
}

function toMispAttribute(
  asset: CtiAsset,
  index: number,
): Record<string, unknown> {
  return {
    uuid: asset.id,
    type: MISP_TYPE_MAP[asset.type] ?? 'text',
    category: MISP_CATEGORY_MAP[asset.type] ?? 'Other',
    value: asset.value,
    to_ids: (asset.threatScore ?? 0) >= 60,
    comment: asset.source
      ? `Source: ${asset.source} | Confidence: ${Math.round((asset.confidence ?? 0) * 100)}%`
      : `Confidence: ${Math.round((asset.confidence ?? 0) * 100)}%`,
    first_seen: asset.firstSeenAt?.toISOString() ?? asset.createdAt.toISOString(),
    last_seen: asset.lastSeenAt?.toISOString() ?? asset.updatedAt.toISOString(),
    timestamp: Math.floor(
      (asset.lastSeenAt ?? asset.updatedAt).getTime() / 1000,
    ),
  };
}

export function exportMispEvent(
  assets: CtiAsset[],
  relations: CtiAssetRelation[],
  workspaceName?: string,
): Record<string, unknown> {
  const now = new Date();
  const maxThreat = Math.max(...assets.map((a) => a.threatScore ?? 0), 0);

  const attributes = assets.map((asset, i) => toMispAttribute(asset, i));

  // Add relation objects as MISP object references
  const objects = relations.length > 0
    ? relations.map((rel) => ({
        name: 'relationship',
        meta_category: 'misc',
        description: `${rel.relationType} relationship`,
        Attribute: [
          {
            type: 'text',
            object_relation: 'source',
            value: rel.sourceAssetId,
          },
          {
            type: 'text',
            object_relation: 'target',
            value: rel.targetAssetId,
          },
          {
            type: 'text',
            object_relation: 'relationship-type',
            value: rel.relationType,
          },
        ],
      }))
    : [];

  return {
    Event: {
      info: `Pensieve CTI Export — ${workspaceName ?? 'Workspace'} — ${now.toISOString().slice(0, 10)}`,
      date: now.toISOString().slice(0, 10),
      threat_level_id: String(threatLevelFromScore(maxThreat)),
      analysis: '2', // completed
      distribution: '0', // your organisation only
      published: false,
      Attribute: attributes,
      Object: objects,
      Tag: [
        { name: 'tlp:amber' },
        { name: 'pensieve:export' },
      ],
    },
  };
}
