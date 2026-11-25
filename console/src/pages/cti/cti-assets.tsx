import Page from '@/components/common/page';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Network } from 'lucide-react';
import { axiosInstance } from '@/services/apis/axios-client';
import { useWorkspaceSelector } from '@/hooks/useWorkspaceSelector';
import CreateWorkspace from '@/pages/workspaces/create-workspace';

interface CtiAsset {
  id: string;
  value: string;
  type: string;
  confidence: number;
  threatScore: number;
  source: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  isActive: boolean;
}

const threatColors = (score: number) => {
  if (score >= 80) return 'text-red-600 dark:text-red-400';
  if (score >= 60) return 'text-orange-600 dark:text-orange-400';
  if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
  if (score >= 20) return 'text-blue-600 dark:text-blue-400';
  return 'text-gray-500';
};

export default function CtiAssetsPage() {
  const { workspaces } = useWorkspaceSelector();
  const hasWorkspace = workspaces.length > 0;

  const { data, isLoading } = useQuery({
    queryKey: ['cti-assets'],
    queryFn: async () => {
      const res = await axiosInstance.get<{ items: CtiAsset[]; total: number }>('/api/cti-assets');
      return res as unknown as { items: CtiAsset[]; total: number };
    },
    enabled: hasWorkspace,
  });

  if (!hasWorkspace) {
    return (
      <Page title="CTI Assets" permission="vulnerability.read">
        <CreateWorkspace />
      </Page>
    );
  }

  const assets = data?.items ?? [];

  return (
    <Page
      title="CTI Assets"
      description="Discovered threat intelligence entities from all scans"
      permission="vulnerability.read"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading...
        </div>
      ) : assets.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 p-12 text-center">
          <Network className="mx-auto mb-3 size-10 text-muted-foreground/40" />
          <p className="text-lg font-medium">No CTI assets yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Assets will appear here after CTI targets are scanned.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Value</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Threat Score</th>
                <th className="px-4 py-3 text-left font-medium">Confidence</th>
                <th className="px-4 py-3 text-left font-medium">Source</th>
                <th className="px-4 py-3 text-left font-medium">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link
                      to="/cti/assets/$assetId"
                      params={{ assetId: a.id }}
                      className="text-primary hover:underline"
                    >
                      {a.value}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{a.type}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${threatColors(a.threatScore)}`}>
                      {a.threatScore}
                    </span>
                    <span className="text-muted-foreground">/100</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {(a.confidence * 100).toFixed(0)}%
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {a.source ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(a.lastSeenAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  );
}
