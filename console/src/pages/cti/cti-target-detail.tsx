import Page from '@/components/common/page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Link, useParams } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  RefreshCw,
  Shield,
  Network,
  Search,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { axiosInstance } from '@/services/apis/axios-client';
import { toast } from 'sonner';

interface CtiTargetDetail {
  id: string;
  value: string;
  type: string;
  label: string | null;
  source: string;
  scanSchedule: string;
  lastScanAt: string | null;
  isEnabled: boolean;
  createdAt: string;
  stats: {
    totalAssets: number;
    assetsByType: { type: string; count: string }[];
    totalFindings: number;
    findingsBySeverity: { severity: string; count: string }[];
    totalInvestigations: number;
  };
}

interface Finding {
  id: string;
  name: string;
  severity: string;
  description: string;
  tags: string[];
  matchedAt: string;
  createdAt: string;
}

interface CtiAsset {
  id: string;
  value: string;
  type: string;
  confidence: number;
  threatScore: number;
  source: string | null;
  lastSeenAt: string;
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  info: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const typeColors: Record<string, string> = {
  DOMAIN: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  IP: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  EMAIL: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  KEYWORD: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  CRYPTO_WALLET: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  ORGANIZATION: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  THREAT_ACTOR: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className={`size-4 ${color}`} />
        <span className="text-xs font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span className={`mt-2 block text-3xl font-bold ${color}`}>{value}</span>
    </div>
  );
}

export default function CtiTargetDetailPage() {
  const { targetId } = useParams({ from: '/_authed/cti/$targetId' });
  const queryClient = useQueryClient();

  const { data: target, isLoading } = useQuery({
    queryKey: ['cti-target', targetId],
    queryFn: async () => {
      const res = await axiosInstance.get<CtiTargetDetail>(`/api/cti-targets/${targetId}`);
      return res as unknown as CtiTargetDetail;
    },
  });

  const { data: findingsData } = useQuery({
    queryKey: ['cti-target-findings', targetId],
    queryFn: async () => {
      const res = await axiosInstance.get<{ items: Finding[]; total: number }>(`/api/cti-targets/${targetId}/findings`);
      return res as unknown as { items: Finding[]; total: number };
    },
    enabled: !!target,
  });

  const { data: assetsData } = useQuery({
    queryKey: ['cti-target-assets', targetId],
    queryFn: async () => {
      const res = await axiosInstance.get<{ items: CtiAsset[]; total: number }>(`/api/cti-assets?ctiTargetId=${targetId}`);
      return res as unknown as { items: CtiAsset[]; total: number };
    },
    enabled: !!target,
  });

  const rescanMutation = useMutation({
    mutationFn: () => axiosInstance.post(`/api/cti-targets/${targetId}/scan`),
    onSuccess: () => {
      toast.success('Re-scan triggered');
      queryClient.invalidateQueries({ queryKey: ['cti-target', targetId] });
    },
  });

  if (isLoading || !target) {
    return (
      <Page title="CTI Target">
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" /> Loading...
        </div>
      </Page>
    );
  }

  const findings = findingsData?.items ?? [];
  const assets = assetsData?.items ?? [];
  const stats = target.stats;

  return (
    <Page
      title={
        <div className="flex items-center gap-3">
          <Link to="/cti">
            <Button variant="ghost" size="icon" className="size-8">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <span className="font-mono">{target.label || target.value}</span>
          <Badge
            variant="outline"
            className={typeColors[target.type] ?? ''}
          >
            {target.type}
          </Badge>
        </div>
      }
      description={`Source: ${target.source} | Schedule: ${target.scanSchedule === 'disabled' ? 'Manual' : target.scanSchedule} | Last scan: ${target.lastScanAt ? new Date(target.lastScanAt).toLocaleDateString() : 'Never'}`}
      permission="vulnerability.read"
      action={
        <Button
          onClick={() => rescanMutation.mutate()}
          disabled={rescanMutation.isPending}
        >
          <RefreshCw className="mr-1.5 size-4" />
          {rescanMutation.isPending ? 'Scanning...' : 'Re-scan'}
        </Button>
      }
    >
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={AlertTriangle}
          label="Findings"
          value={stats.totalFindings}
          color="text-red-600 dark:text-red-400"
        />
        <StatCard
          icon={Network}
          label="Assets"
          value={stats.totalAssets}
          color="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          icon={Search}
          label="Investigations"
          value={stats.totalInvestigations}
          color="text-purple-600 dark:text-purple-400"
        />
        <StatCard
          icon={Shield}
          label="Severity Breakdown"
          value={stats.findingsBySeverity.reduce(
            (sum, s) =>
              sum +
              (s.severity === 'critical' || s.severity === 'high'
                ? parseInt(s.count, 10)
                : 0),
            0,
          )}
          color="text-orange-600 dark:text-orange-400"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="findings" className="mt-6">
        <TabsList>
          <TabsTrigger value="findings">
            Findings ({stats.totalFindings})
          </TabsTrigger>
          <TabsTrigger value="assets">
            Assets ({stats.totalAssets})
          </TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        {/* Findings Tab */}
        <TabsContent value="findings" className="mt-4">
          {findings.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              No findings yet. Trigger a scan to start collecting intelligence.
            </div>
          ) : (
            <div className="space-y-2">
              {findings.map((f) => (
                <div
                  key={f.id}
                  className="flex items-start gap-3 rounded-lg border px-4 py-3"
                >
                  <Badge
                    variant="outline"
                    className={`mt-0.5 shrink-0 ${severityColors[f.severity] ?? ''}`}
                  >
                    {f.severity}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{f.name}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {f.matchedAt} — {f.description}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {f.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(f.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets" className="mt-4">
          {assets.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              No assets discovered yet.
            </div>
          ) : (
            <div className="rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium">Value</th>
                    <th className="px-4 py-2 text-left font-medium">Type</th>
                    <th className="px-4 py-2 text-left font-medium">Threat</th>
                    <th className="px-4 py-2 text-left font-medium">Source</th>
                    <th className="px-4 py-2 text-left font-medium">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((a) => (
                    <tr key={a.id} className="border-b last:border-0">
                      <td className="px-4 py-2 font-mono text-xs">
                        <Link
                          to="/cti/assets/$assetId"
                          params={{ assetId: a.id }}
                          className="text-primary hover:underline"
                        >
                          {a.value}
                        </Link>
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="outline">{a.type}</Badge>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`font-bold ${
                            a.threatScore >= 80
                              ? 'text-red-600'
                              : a.threatScore >= 60
                                ? 'text-orange-600'
                                : a.threatScore >= 40
                                  ? 'text-yellow-600'
                                  : 'text-gray-500'
                          }`}
                        >
                          {a.threatScore}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {a.source ?? '-'}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {new Date(a.lastSeenAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-2 gap-6">
            {/* Target Info */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Target Information
              </h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Value</dt>
                  <dd className="font-mono">{target.value}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Type</dt>
                  <dd>{target.type}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Source</dt>
                  <dd>{target.source}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Schedule</dt>
                  <dd>
                    {target.scanSchedule === 'disabled'
                      ? 'Manual'
                      : target.scanSchedule}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd>{new Date(target.createdAt).toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Last Scan</dt>
                  <dd>
                    {target.lastScanAt
                      ? new Date(target.lastScanAt).toLocaleString()
                      : 'Never'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Severity Breakdown */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Findings by Severity
              </h3>
              {stats.findingsBySeverity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No findings yet</p>
              ) : (
                <div className="space-y-3">
                  {['critical', 'high', 'medium', 'low', 'info'].map((sev) => {
                    const item = stats.findingsBySeverity.find(
                      (s) => s.severity === sev,
                    );
                    const count = item ? parseInt(item.count, 10) : 0;
                    if (count === 0) return null;
                    const maxCount = Math.max(
                      ...stats.findingsBySeverity.map((s) =>
                        parseInt(s.count, 10),
                      ),
                    );
                    return (
                      <div key={sev} className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={`w-16 justify-center ${severityColors[sev]}`}
                        >
                          {sev}
                        </Badge>
                        <div className="flex-1">
                          <div className="h-5 overflow-hidden rounded bg-muted">
                            <div
                              className={`h-full rounded ${
                                sev === 'critical'
                                  ? 'bg-red-500'
                                  : sev === 'high'
                                    ? 'bg-orange-500'
                                    : sev === 'medium'
                                      ? 'bg-yellow-500'
                                      : sev === 'low'
                                        ? 'bg-blue-500'
                                        : 'bg-gray-400'
                              }`}
                              style={{
                                width: `${Math.max((count / maxCount) * 100, 5)}%`,
                              }}
                            />
                          </div>
                        </div>
                        <span className="w-8 text-right text-sm font-medium">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Assets by Type */}
            <div className="col-span-2 rounded-lg border bg-card p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Assets by Type
              </h3>
              {stats.assetsByType.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No assets discovered yet
                </p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {stats.assetsByType.map((a) => (
                    <div
                      key={a.type}
                      className="rounded-lg border px-4 py-2 text-center"
                    >
                      <span className="text-2xl font-bold">{a.count}</span>
                      <span className="ml-1 text-xs text-muted-foreground">
                        {a.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Page>
  );
}
