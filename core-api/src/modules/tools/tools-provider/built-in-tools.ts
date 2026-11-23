/* eslint-disable */

import { DataKind, JobPriority, ToolCategory } from '@/common/enums/enum';
import { randomUUID } from 'crypto';
import { Asset } from '../../assets/entities/assets.entity';
import { TargetType } from '@/common/enums/enum';
import { Tool } from '../entities/tools.entity';
import { categorySpec } from '../tool-categories';

export const builtInTools: Tool[] = [
  {
    name: 'revelio',
    categories: [
      categorySpec(ToolCategory.SUBDOMAINS, [TargetType.DOMAIN], {
        inputs: [DataKind.TARGET],
        produces: [DataKind.HOST],
      }),
    ],
    description:
      'Passive subdomain enumeration engine that reveals hidden subdomains using OSINT sources and DNS resolution.',
    logoUrl: '/connectors/revelio.png',
    command:
      '(echo {{value}} && subfinder -duc -d {{value}}) | dnsx -duc -a -aaaa -cname -mx -ns -soa -txt -resp',
    parser: (result: string) => {
      const parsed: Record<string, Record<string, string[]>> = {};
      result.split('\n').forEach((line) => {
        const cleaned = line.replace(/\x1B\[[0-9;]*m/g, '').trim();
        const match = cleaned.match(/^([^\[]+)\s+\[([A-Z]+)\]\s+\[(.+)\]$/);
        if (!match) return;
        const [, domain, type, value] = match;
        if (!parsed[domain]) parsed[domain] = {};
        if (!parsed[domain][type]) parsed[domain][type] = [];
        parsed[domain][type].push(value);
      });
      return Object.keys(parsed).map((i) => ({
        id: randomUUID(),
        value: i,
        dnsRecords: parsed[i],
      })) as Asset[];
    },
    version: '2.8.0',
    priority: JobPriority.MEDIUM,
  },
  {
    name: 'omnioculars',
    categories: [
      categorySpec(ToolCategory.HTTP_PROBE, [TargetType.DOMAIN, TargetType.IP, TargetType.CIDR], {
        inputs: [DataKind.SERVICE],
        produces: [DataKind.WEB],
      }),
    ],
    description:
      'Multi-purpose HTTP reconnaissance probe that inspects web services for status codes, technologies, TLS certificates, CDN detection and server fingerprints.',
    logoUrl: '/connectors/omnioculars.png',
    command:
      'httpx -duc -u {{value}} -status-code -favicon -asn -title -web-server -irr -tech-detect -ip -cname -location -tls-grab -cdn -probe -json -follow-redirects -timeout 10 -threads 100 -silent',
    parser: JSON.parse,
    version: '1.7.1',
    priority: JobPriority.MEDIUM,
  },
  {
    name: 'remembrall',
    categories: [
      categorySpec(ToolCategory.SCREENSHOT, [TargetType.DOMAIN, TargetType.IP, TargetType.CIDR], {
        inputs: [DataKind.WEB],
        produces: [],
      }),
    ],
    description: 'Captures visual snapshots of live web pages for quick reconnaissance and change detection.',
    logoUrl: '/connectors/remembrall.png',
    parser: JSON.parse,
    version: '1.0.0',
    command: 'screenshot {{value}}',
    priority: JobPriority.MEDIUM,
  },
  {
    name: 'sneakoscope',
    categories: [
      categorySpec(ToolCategory.PORTS_SCANNER, [TargetType.DOMAIN, TargetType.IP, TargetType.CIDR], {
        inputs: [DataKind.HOST],
        produces: [DataKind.SERVICE],
      }),
    ],
    description:
      'High-speed TCP port scanner optimized for reliability, discovering open services across your attack surface.',
    logoUrl: '/connectors/sneakoscope.png',
    command: 'naabu -host {{value}} -silent -sr',
    parser: (result: string) => {
      const parsed = result
        .trim()
        .split('\n')
        .filter((i) => i.includes(':'))
        .map((i) => Number(i.split(':')[1].replace(/\r/g, '')))
        .sort();
      return parsed;
    },
    version: '2.3.5',
    priority: JobPriority.MEDIUM,
  },
];
