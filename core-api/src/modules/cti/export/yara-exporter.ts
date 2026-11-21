import { CtiAsset } from '../entities/cti-asset.entity';

/**
 * Escapes a string for use in YARA string definitions.
 */
function yaraEscape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Sanitizes a value into a valid YARA identifier.
 */
function toYaraId(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^(\d)/, '_$1')
    .slice(0, 64);
}

function generateDomainRule(assets: CtiAsset[]): string | null {
  const domains = assets.filter(
    (a) => a.type === 'DOMAIN' && (a.threatScore ?? 0) >= 40,
  );
  if (domains.length === 0) return null;

  const strings = domains
    .map(
      (d, i) =>
        `        $domain_${i} = "${yaraEscape(d.value)}" ascii wide nocase`,
    )
    .join('\n');

  return `rule Pensieve_Malicious_Domains
{
    meta:
        description = "Domains flagged by Pensieve CTI"
        author = "Pensieve Auto-Export"
        date = "${new Date().toISOString().slice(0, 10)}"
        threat_level = "high"
        count = "${domains.length}"

    strings:
${strings}

    condition:
        any of ($domain_*)
}`;
}

function generateIpRule(assets: CtiAsset[]): string | null {
  const ips = assets.filter(
    (a) => a.type === 'IP' && (a.threatScore ?? 0) >= 40,
  );
  if (ips.length === 0) return null;

  const strings = ips
    .map(
      (ip, i) =>
        `        $ip_${i} = "${yaraEscape(ip.value)}" ascii wide`,
    )
    .join('\n');

  return `rule Pensieve_Malicious_IPs
{
    meta:
        description = "IP addresses flagged by Pensieve CTI"
        author = "Pensieve Auto-Export"
        date = "${new Date().toISOString().slice(0, 10)}"
        threat_level = "high"
        count = "${ips.length}"

    strings:
${strings}

    condition:
        any of ($ip_*)
}`;
}

function generateHashRule(assets: CtiAsset[]): string | null {
  const hashes = assets.filter(
    (a) => a.type === 'FILE_HASH' && (a.threatScore ?? 0) >= 40,
  );
  if (hashes.length === 0) return null;

  const strings = hashes
    .map((h, i) => {
      const hash = h.value.replace(/^(sha256:|md5:|sha1:)/i, '');
      return `        $hash_${i} = "${yaraEscape(hash)}" ascii wide nocase`;
    })
    .join('\n');

  return `rule Pensieve_Malicious_Hashes
{
    meta:
        description = "File hashes flagged by Pensieve CTI"
        author = "Pensieve Auto-Export"
        date = "${new Date().toISOString().slice(0, 10)}"
        threat_level = "high"
        count = "${hashes.length}"

    strings:
${strings}

    condition:
        any of ($hash_*)
}`;
}

function generateUrlRule(assets: CtiAsset[]): string | null {
  const urls = assets.filter(
    (a) => (a.type === 'URL' || a.type === 'ONION') && (a.threatScore ?? 0) >= 40,
  );
  if (urls.length === 0) return null;

  const strings = urls
    .map(
      (u, i) =>
        `        $url_${i} = "${yaraEscape(u.value)}" ascii wide nocase`,
    )
    .join('\n');

  return `rule Pensieve_Malicious_URLs
{
    meta:
        description = "URLs flagged by Pensieve CTI"
        author = "Pensieve Auto-Export"
        date = "${new Date().toISOString().slice(0, 10)}"
        threat_level = "high"
        count = "${urls.length}"

    strings:
${strings}

    condition:
        any of ($url_*)
}`;
}

/**
 * Generates YARA rules from CTI assets.
 * Only assets with threat score >= 40 are included.
 * Returns a string containing all YARA rules, or null if no rules generated.
 */
export function exportYaraRules(assets: CtiAsset[]): string {
  const header = `/*
 * Pensieve CTI — YARA Rules Export
 * Generated: ${new Date().toISOString()}
 * Total assets: ${assets.length}
 * Rules include assets with threat score >= 40
 */

import "pe"

`;

  const rules = [
    generateDomainRule(assets),
    generateIpRule(assets),
    generateHashRule(assets),
    generateUrlRule(assets),
  ].filter(Boolean);

  if (rules.length === 0) {
    return header + '/* No assets with threat score >= 40 found */\n';
  }

  return header + rules.join('\n\n') + '\n';
}
