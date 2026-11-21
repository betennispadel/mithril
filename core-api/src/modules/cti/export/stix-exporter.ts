import { CtiAsset } from '../entities/cti-asset.entity';
import { CtiAssetRelation } from '../entities/cti-asset-relation.entity';

/**
 * Maps CTI asset types to STIX 2.1 SDO (Structured Data Object) types.
 */
const STIX_TYPE_MAP: Record<string, string> = {
  DOMAIN: 'domain-name',
  IP: 'ipv4-addr',
  URL: 'url',
  EMAIL: 'email-addr',
  FILE_HASH: 'file',
  CRYPTO_WALLET: 'artifact',
  THREAT_ACTOR: 'threat-actor',
  ORGANIZATION: 'identity',
  CVE: 'vulnerability',
  ASN: 'autonomous-system',
  ONION: 'domain-name',
  USERNAME: 'user-account',
  KEYWORD: 'note',
  PHONE: 'artifact',
  TELEGRAM_CHANNEL: 'artifact',
  APP_PACKAGE: 'software',
};

/**
 * Maps CTI relation types to STIX 2.1 SRO (Structured Relationship Object) types.
 */
const STIX_RELATION_MAP: Record<string, string> = {
  uses: 'uses',
  'communicates-with': 'communicates-with',
  'attributed-to': 'attributed-to',
  'funded-by': 'related-to',
  'associated-with': 'related-to',
  'hosted-on': 'consists-of',
  'resolves-to': 'related-to',
  indicates: 'indicates',
  targets: 'targets',
};

function uuid5Deterministic(namespace: string, value: string): string {
  // Simple deterministic ID generation for STIX objects
  // Format: stix-type--uuid
  const hash = Buffer.from(`${namespace}:${value}`)
    .toString('base64')
    .replace(/[^a-f0-9]/gi, '')
    .slice(0, 32)
    .padEnd(32, '0');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

function toStixObject(asset: CtiAsset): Record<string, unknown> {
  const stixType = asset.stixType ?? STIX_TYPE_MAP[asset.type] ?? 'artifact';
  const id = `${stixType}--${uuid5Deterministic(stixType, asset.value)}`;

  const base: Record<string, unknown> = {
    type: stixType,
    spec_version: '2.1',
    id,
    created: asset.firstSeenAt?.toISOString() ?? asset.createdAt.toISOString(),
    modified: asset.lastSeenAt?.toISOString() ?? asset.updatedAt.toISOString(),
  };

  switch (stixType) {
    case 'domain-name':
      return { ...base, value: asset.value };
    case 'ipv4-addr':
      return { ...base, value: asset.value };
    case 'url':
      return { ...base, value: asset.value };
    case 'email-addr':
      return { ...base, value: asset.value };
    case 'file':
      return {
        ...base,
        hashes: { SHA256: asset.value.replace('sha256:', '') },
      };
    case 'threat-actor':
      return {
        ...base,
        name: asset.value,
        threat_actor_types: ['unknown'],
        confidence: Math.round((asset.confidence ?? 0) * 100),
      };
    case 'identity':
      return {
        ...base,
        name: asset.value,
        identity_class: 'organization',
      };
    case 'vulnerability':
      return {
        ...base,
        name: asset.value,
        external_references: asset.value.startsWith('CVE-')
          ? [{ source_name: 'cve', external_id: asset.value }]
          : [],
      };
    case 'autonomous-system':
      return {
        ...base,
        number: parseInt(asset.value.replace(/^AS/i, ''), 10) || 0,
      };
    case 'user-account':
      return { ...base, account_login: asset.value };
    case 'software':
      return { ...base, name: asset.value };
    case 'note':
      return { ...base, content: asset.value, abstract: 'CTI keyword search' };
    default:
      return { ...base, payload_bin: asset.value };
  }
}

function toStixIndicator(asset: CtiAsset): Record<string, unknown> | null {
  if ((asset.threatScore ?? 0) < 40) return null;

  const patterns: Record<string, string> = {
    DOMAIN: `[domain-name:value = '${asset.value}']`,
    IP: `[ipv4-addr:value = '${asset.value}']`,
    URL: `[url:value = '${asset.value}']`,
    EMAIL: `[email-addr:value = '${asset.value}']`,
    FILE_HASH: `[file:hashes.SHA256 = '${asset.value.replace('sha256:', '')}']`,
  };

  const pattern = patterns[asset.type];
  if (!pattern) return null;

  return {
    type: 'indicator',
    spec_version: '2.1',
    id: `indicator--${uuid5Deterministic('indicator', asset.value)}`,
    created: asset.firstSeenAt?.toISOString() ?? asset.createdAt.toISOString(),
    modified: asset.lastSeenAt?.toISOString() ?? asset.updatedAt.toISOString(),
    name: `CTI indicator: ${asset.value}`,
    pattern,
    pattern_type: 'stix',
    valid_from: asset.firstSeenAt?.toISOString() ?? asset.createdAt.toISOString(),
    confidence: Math.round((asset.confidence ?? 0) * 100),
    indicator_types: asset.threatScore >= 80 ? ['malicious-activity'] : ['anomalous-activity'],
  };
}

function toStixRelationship(
  rel: CtiAssetRelation,
  assetMap: Map<string, CtiAsset>,
): Record<string, unknown> | null {
  const source = assetMap.get(rel.sourceAssetId);
  const target = assetMap.get(rel.targetAssetId);
  if (!source || !target) return null;

  const sourceType = source.stixType ?? STIX_TYPE_MAP[source.type] ?? 'artifact';
  const targetType = target.stixType ?? STIX_TYPE_MAP[target.type] ?? 'artifact';

  return {
    type: 'relationship',
    spec_version: '2.1',
    id: `relationship--${uuid5Deterministic('rel', `${source.value}-${rel.relationType}-${target.value}`)}`,
    created: rel.createdAt.toISOString(),
    modified: rel.createdAt.toISOString(),
    relationship_type: STIX_RELATION_MAP[rel.relationType] ?? 'related-to',
    source_ref: `${sourceType}--${uuid5Deterministic(sourceType, source.value)}`,
    target_ref: `${targetType}--${uuid5Deterministic(targetType, target.value)}`,
    confidence: Math.round((rel.confidence ?? 0) * 100),
  };
}

export function exportStixBundle(
  assets: CtiAsset[],
  relations: CtiAssetRelation[],
): Record<string, unknown> {
  const assetMap = new Map(assets.map((a) => [a.id, a]));
  const objects: Record<string, unknown>[] = [];

  // Add SCOs (observable objects)
  for (const asset of assets) {
    objects.push(toStixObject(asset));

    // Add indicator for high-threat-score items
    const indicator = toStixIndicator(asset);
    if (indicator) {
      objects.push(indicator);
    }
  }

  // Add SROs (relationships)
  for (const rel of relations) {
    const sro = toStixRelationship(rel, assetMap);
    if (sro) {
      objects.push(sro);
    }
  }

  return {
    type: 'bundle',
    id: `bundle--${uuid5Deterministic('bundle', new Date().toISOString())}`,
    objects,
  };
}
