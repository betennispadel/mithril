import Page from '@/components/common/page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { axiosInstance } from '@/services/apis/axios-client';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  Eye,
  Globe,
  Hash,
  Info,
  Link2,
  Shield,
  Tag,
} from 'lucide-react';

interface CtiFindingDetail {
  id: string;
  name: string;
  severity: string;
  description: string;
  category: string;
  tags: string[];
  references: string[];
  matchedAt: string;
  source: string;
  fingerprint: string;
  confidence: number | null;
  threatScore: number | null;
  firstSeenAt: string;
  lastSeenAt: string;
  timesDetected: number;
  metadata: Record<string, any>;
  targetValue: string;
  targetType: string;
  targetLabel: string | null;
  ctiTargetId: string;
  relatedFindings: {
    id: string;
    name: string;
    severity: string;
    category: string;
    source: string;
    matchedAt: string;
    firstSeenAt: string;
  }[];
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  low: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  info: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

function SeverityBadge({ severity }: { severity: string }) {
  return (
    <Badge variant="outline" className={`text-sm ${severityColors[severity] ?? severityColors.info}`}>
      {severity.toUpperCase()}
    </Badge>
  );
}

function MetadataSection({ metadata }: { metadata: Record<string, any> }) {
  const entries = Object.entries(metadata).filter(
    ([, v]) => v !== null && v !== undefined && v !== '' && v !== 0 && !(Array.isArray(v) && v.length === 0),
  );
  if (entries.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
        <Info className="h-4 w-4" /> Enrichment Data
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {entries.map(([key, value]) => (
          <div key={key} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
            <div className="text-xs text-zinc-500 mb-1">{formatKey(key)}</div>
            <div className="text-sm text-zinc-200 break-all">
              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/_/g, ' ');
}

export default function CtiFindingDetailPage() {
  const { findingId = '' } = useParams({ strict: false }) as { findingId?: string };

  const { data, isLoading, error } = useQuery({
    queryKey: ['cti-finding', findingId],
    queryFn: async () => {
      const res = await axiosInstance.get<CtiFindingDetail>(`/api/cti-findings/${findingId}`);
      return res as unknown as CtiFindingDetail;
    },
    enabled: !!findingId,
  });

  if (isLoading) {
    return (
      <Page permission="vulnerability.read">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </Page>
    );
  }

  if (error || !data) {
    return (
      <Page title="Finding" permission="vulnerability.read">
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            This finding does not exist, or you don't have access to it.
          </p>
          <Button variant="outline" asChild>
            <Link to="/cti">Back to CTI Targets</Link>
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <Page title={data.name} permission="vulnerability.read">
      <div className="flex flex-col gap-4">
        {/* Back button */}
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/cti-darkweb">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to findings
            </Link>
          </Button>
        </div>

        {/* Hero Section */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <SeverityBadge severity={data.severity} />
                <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                  {data.category}
                </Badge>
                {data.source && (
                  <Badge variant="outline" className="border-zinc-700 text-zinc-500">
                    {data.source}
                  </Badge>
                )}
              </div>
              <h1 className="text-xl font-semibold text-zinc-100 mb-2">{data.name}</h1>
              {data.matchedAt && (
                <div className="flex items-center gap-2 text-sm text-zinc-400 font-mono">
                  <Globe className="h-3.5 w-3.5" />
                  {data.matchedAt}
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 text-sm text-zinc-500">
              {data.confidence != null && data.confidence > 0 && (
                <div className="flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" />
                  Confidence: {Math.round(data.confidence * 100)}%
                </div>
              )}
              {data.threatScore != null && data.threatScore > 0 && (
                <div className="flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" />
                  Threat Score: {data.threatScore}
                </div>
              )}
              {data.timesDetected > 1 && (
                <div className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  Seen {data.timesDetected}x
                </div>
              )}
            </div>
          </div>

          {/* Target info */}
          {data.targetValue && (
            <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center gap-2 text-sm text-zinc-400">
              <Link2 className="h-3.5 w-3.5" />
              Target: <span className="text-zinc-200">{data.targetLabel || data.targetValue}</span>
              <Badge variant="outline" className="border-zinc-700 text-zinc-500 text-xs">
                {data.targetType}
              </Badge>
            </div>
          )}

          {/* Timestamps */}
          <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              First seen: {new Date(data.firstSeenAt).toLocaleString()}
            </span>
            {data.lastSeenAt && data.lastSeenAt !== data.firstSeenAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last seen: {new Date(data.lastSeenAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="details" className="min-w-0 gap-4">
          <TabsList className="flex w-max flex-nowrap rounded-none bg-transparent p-0">
            <TabsTrigger value="details" className="h-9 flex-none">Details</TabsTrigger>
            <TabsTrigger value="metadata" className="h-9 flex-none">
              Enrichment
            </TabsTrigger>
            <TabsTrigger value="related" className="h-9 flex-none"
              badge={data.relatedFindings?.length || undefined}
            >
              Related
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="rounded-xl border border-zinc-800 bg-card divide-y divide-zinc-800">
              {/* Description */}
              {data.description && (
                <div className="p-5">
                  <h3 className="text-sm font-medium text-zinc-300 mb-2">Description</h3>
                  <p className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">
                    {data.description}
                  </p>
                </div>
              )}

              {/* Tags */}
              {data.tags?.length > 0 && (
                <div className="p-5">
                  <h3 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4" /> Tags
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {data.tags.map((tag: string) => (
                      <Badge key={tag} variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* References */}
              {data.references?.length > 0 && (
                <div className="p-5">
                  <h3 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" /> References
                  </h3>
                  <ul className="space-y-1">
                    {data.references.map((ref: string, i: number) => (
                      <li key={i}>
                        <a
                          href={ref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-400 hover:text-blue-300 hover:underline break-all"
                        >
                          {ref}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Fingerprint */}
              {data.fingerprint && (
                <div className="p-5">
                  <h3 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                    <Hash className="h-4 w-4" /> Fingerprint
                  </h3>
                  <code className="text-xs text-zinc-500 font-mono">{data.fingerprint}</code>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="metadata">
            <div className="rounded-xl border border-zinc-800 bg-card p-5">
              <MetadataSection metadata={data.metadata ?? {}} />
              {(!data.metadata || Object.keys(data.metadata).length === 0) && (
                <p className="text-sm text-zinc-500 text-center py-8">
                  No enrichment data available for this finding.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="related">
            <div className="rounded-xl border border-zinc-800 bg-card">
              {data.relatedFindings?.length > 0 ? (
                <div className="divide-y divide-zinc-800">
                  {data.relatedFindings.map((rf) => (
                    <Link
                      key={rf.id}
                      to="/cti/findings/$findingId"
                      params={{ findingId: rf.id }}
                      className="flex items-center gap-3 p-4 hover:bg-zinc-900/50 transition-colors"
                    >
                      <SeverityBadge severity={rf.severity} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-zinc-200 truncate">{rf.name}</div>
                        <div className="text-xs text-zinc-500">
                          {rf.source} · {rf.matchedAt?.substring(0, 40)}
                        </div>
                      </div>
                      <div className="text-xs text-zinc-500">
                        {new Date(rf.firstSeenAt).toLocaleDateString()}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 text-center py-8">
                  No related findings found.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Page>
  );
}
