import Page from '@/components/common/page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, ArrowRight } from 'lucide-react';
import { axiosInstance } from '@/services/apis/axios-client';

interface CtiAssetDetail {
  id: string;
  value: string;
  type: string;
  confidence: number;
  threatScore: number;
  source: string | null;
  stixType: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  isActive: boolean;
  metadata: Record<string, any>;
  ctiTarget: {
    id: string;
    value: string;
    type: string;
  };
}

interface CtiRelation {
  id: string;
  relationType: string;
  confidence: number;
  source: string | null;
  sourceAsset: { id: string; value: string; type: string };
  targetAsset: { id: string; value: string; type: string };
}

const threatColor = (score: number) => {
  if (score >= 80) return 'text-red-600 dark:text-red-400';
  if (score >= 60) return 'text-orange-600 dark:text-orange-400';
  if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
  if (score >= 20) return 'text-blue-600 dark:text-blue-400';
  return 'text-gray-500';
};

const threatBg = (score: number) => {
  if (score >= 80) return 'bg-red-500';
  if (score >= 60) return 'bg-orange-500';
  if (score >= 40) return 'bg-yellow-500';
  if (score >= 20) return 'bg-blue-500';
  return 'bg-gray-400';
};

export default function CtiAssetDetailPage() {
  const { assetId } = useParams({ from: '/_authed/cti/assets/$assetId' });

  const { data: asset, isLoading } = useQuery({
    queryKey: ['cti-asset', assetId],
    queryFn: async () => {
      const res = await axiosInstance.get<CtiAssetDetail>(`/api/cti-assets/${assetId}`);
      return res as unknown as CtiAssetDetail;
    },
  });

  const { data: relations } = useQuery({
    queryKey: ['cti-asset-relations', assetId],
    queryFn: async () => {
      const res = await axiosInstance.get<CtiRelation[]>(`/api/cti-assets/${assetId}/relations`);
      return res as unknown as CtiRelation[];
    },
    enabled: !!asset,
  });

  if (isLoading || !asset) {
    return (
      <Page title="CTI Asset">
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" /> Loading...
        </div>
      </Page>
    );
  }

  const rels = relations ?? [];
  const metaEntries = Object.entries(asset.metadata).filter(
    ([, v]) => v !== null && v !== undefined && v !== '',
  );

  return (
    <Page
      title={
        <div className="flex items-center gap-3">
          <Link to="/cti/assets">
            <Button variant="ghost" size="icon" className="size-8">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <span className="font-mono text-lg">{asset.value}</span>
          <Badge variant="outline">{asset.type}</Badge>
          {asset.stixType && (
            <Badge variant="secondary" className="text-[10px]">
              STIX: {asset.stixType}
            </Badge>
          )}
        </div>
      }
      description={`Discovered from target: ${asset.ctiTarget?.value ?? 'Unknown'} | Source: ${asset.source ?? 'N/A'}`}
      permission="vulnerability.read"
    >
      <div className="grid grid-cols-3 gap-6">
        {/* Threat Score Card */}
        <div className="rounded-lg border bg-card p-6 text-center">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Threat Score
          </span>
          <div className="mt-3">
            <span className={`text-5xl font-bold ${threatColor(asset.threatScore)}`}>
              {asset.threatScore}
            </span>
            <span className="text-lg text-muted-foreground">/100</span>
          </div>
          <div className="mx-auto mt-3 h-2 w-3/4 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${threatBg(asset.threatScore)}`}
              style={{ width: `${asset.threatScore}%` }}
            />
          </div>
        </div>

        {/* Confidence Card */}
        <div className="rounded-lg border bg-card p-6 text-center">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Confidence
          </span>
          <div className="mt-3">
            <span className="text-5xl font-bold text-primary">
              {(asset.confidence * 100).toFixed(0)}
            </span>
            <span className="text-lg text-muted-foreground">%</span>
          </div>
          <div className="mx-auto mt-3 h-2 w-3/4 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${asset.confidence * 100}%` }}
            />
          </div>
        </div>

        {/* Timeline Card */}
        <div className="rounded-lg border bg-card p-6">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Timeline
          </span>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">First Seen</dt>
              <dd>{new Date(asset.firstSeenAt).toLocaleDateString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Last Seen</dt>
              <dd>{new Date(asset.lastSeenAt).toLocaleDateString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge
                  variant="outline"
                  className={
                    asset.isActive
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-gray-100 text-gray-500'
                  }
                >
                  {asset.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Relations */}
      <div className="mt-6 rounded-lg border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Relations ({rels.length})
        </h3>
        {rels.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No relations discovered yet. Relations are built as more entities
            are found across scans.
          </p>
        ) : (
          <div className="space-y-2">
            {rels.map((rel) => {
              const isSource = rel.sourceAsset.id === assetId;
              const other = isSource ? rel.targetAsset : rel.sourceAsset;
              return (
                <div
                  key={rel.id}
                  className="flex items-center gap-3 rounded-md border px-4 py-2 text-sm"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {isSource ? asset.value : other.value}
                  </span>
                  <ArrowRight className="size-3 text-muted-foreground" />
                  <Badge variant="secondary" className="text-[10px]">
                    {rel.relationType}
                  </Badge>
                  <ArrowRight className="size-3 text-muted-foreground" />
                  <Link
                    to="/cti/assets/$assetId"
                    params={{ assetId: other.id }}
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    {isSource ? other.value : asset.value}
                  </Link>
                  <Badge variant="outline" className="ml-auto text-[10px]">
                    {other.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {(rel.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Enrichment Metadata */}
      {metaEntries.length > 0 && (
        <div className="mt-6 rounded-lg border bg-card p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Enrichment Data
          </h3>
          <div className="rounded border">
            <table className="w-full text-sm">
              <tbody>
                {metaEntries.map(([key, value]) => (
                  <tr key={key} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium text-muted-foreground">
                      {key}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {typeof value === 'object'
                        ? JSON.stringify(value, null, 2)
                        : String(value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Page>
  );
}
