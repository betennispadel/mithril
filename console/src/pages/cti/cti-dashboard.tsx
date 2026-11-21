import Page from '@/components/common/page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  Shield,
  Crosshair,
  Network,
  AlertTriangle,
  Activity,
  TrendingUp,
  Download,
} from 'lucide-react';
import { axiosInstance } from '@/services/apis/axios-instance';
import { useWorkspaceSelector } from '@/hooks/useWorkspaceSelector';
import CreateWorkspace from '@/pages/workspaces/create-workspace';

interface DashboardData {
  totalTargets: number;
  activeTargets: number;
  totalAssets: number;
  totalFindings: number;
  assetsByType: Array<{ type: string; count: string; avgScore: string; maxScore: string }>;
  threatDistribution: Array<{ level: string; count: string }>;
  findingsBySeverity: Array<{ severity: string; count: string }>;
  recentAssets: Array<{
    id: string;
    value: string;
    type: string;
    threatScore: number;
    source: string | null;
    firstSeenAt: string;
  }>;
  topThreats: Array<{
    id: string;
    value: string;
    type: string;
    threatScore: number;
    source: string | null;
  }>;
  scanActivity: Array<{ date: string; count: string }>;
}

const threatColors: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
  info: 'bg-gray-400',
};

const threatTextColors: Record<string, string> = {
  critical: 'text-red-600 dark:text-red-400',
  high: 'text-orange-600 dark:text-orange-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  low: 'text-blue-600 dark:text-blue-400',
  info: 'text-gray-500',
};

const severityColors: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-yellow-500',
  LOW: 'bg-blue-500',
  INFO: 'bg-gray-400',
};

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex size-10 items-center justify-center rounded-lg ${color ?? 'bg-primary/10 text-primary'}`}
        >
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

function ThreatBar({
  level,
  count,
  total,
}: {
  level: string;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span
        className={`w-16 text-xs font-medium capitalize ${threatTextColors[level] ?? ''}`}
      >
        {level}
      </span>
      <div className="flex-1 overflow-hidden rounded-full bg-muted h-2.5">
        <div
          className={`h-full rounded-full ${threatColors[level] ?? 'bg-gray-400'}`}
          style={{ width: `${Math.max(pct, 1)}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs text-muted-foreground">
        {count}
      </span>
    </div>
  );
}

export default function CtiDashboardPage() {
  const { workspaces } = useWorkspaceSelector();
  const hasWorkspace = workspaces.length > 0;

  const { data, isLoading } = useQuery({
    queryKey: ['cti-dashboard'],
    queryFn: () =>
      axiosInstance
        .get<DashboardData>('/cti-targets/dashboard')
        .then((r) => r.data),
    enabled: hasWorkspace,
    refetchInterval: 30000,
  });

  if (!hasWorkspace) {
    return (
      <Page title="CTI Dashboard" permission="vulnerability.read">
        <CreateWorkspace />
      </Page>
    );
  }

  if (isLoading || !data) {
    return (
      <Page title="CTI Dashboard" permission="vulnerability.read">
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading...
        </div>
      </Page>
    );
  }

  const totalThreat = data.threatDistribution.reduce(
    (sum, d) => sum + parseInt(d.count, 10),
    0,
  );

  return (
    <Page
      title="CTI Dashboard"
      description="Threat intelligence overview and analytics"
      permission="vulnerability.read"
      action={
        <div className="flex gap-2">
          <Link to="/cti/start-discovery">
            <Button variant="outline" size="sm">
              <Crosshair className="mr-1.5 size-4" />
              Start Discovery
            </Button>
          </Link>
          <a href="/api/cti-assets/export/stix" target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm">
              <Download className="mr-1.5 size-4" />
              Export STIX
            </Button>
          </a>
        </div>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={Crosshair}
          label="Active Targets"
          value={`${data.activeTargets}/${data.totalTargets}`}
        />
        <StatCard
          icon={Network}
          label="Total Assets"
          value={data.totalAssets}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
        />
        <StatCard
          icon={AlertTriangle}
          label="Total Findings"
          value={data.totalFindings}
          color="bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400"
        />
        <StatCard
          icon={Shield}
          label="Critical Threats"
          value={
            data.threatDistribution.find((d) => d.level === 'critical')
              ?.count ?? '0'
          }
          color="bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400"
        />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Threat Distribution */}
        <div className="rounded-lg border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold">
            Threat Score Distribution
          </h3>
          <div className="space-y-3">
            {['critical', 'high', 'medium', 'low', 'info'].map((level) => {
              const item = data.threatDistribution.find(
                (d) => d.level === level,
              );
              return (
                <ThreatBar
                  key={level}
                  level={level}
                  count={parseInt(item?.count ?? '0', 10)}
                  total={totalThreat}
                />
              );
            })}
          </div>
        </div>

        {/* Findings by Severity */}
        <div className="rounded-lg border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold">Findings by Severity</h3>
          <div className="space-y-3">
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map((sev) => {
              const item = data.findingsBySeverity.find(
                (d) => d.severity === sev,
              );
              const count = parseInt(item?.count ?? '0', 10);
              const totalF = data.totalFindings || 1;
              const pct = (count / totalF) * 100;
              return (
                <div key={sev} className="flex items-center gap-3">
                  <span className="w-16 text-xs font-medium">{sev}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-muted h-2.5">
                    <div
                      className={`h-full rounded-full ${severityColors[sev]}`}
                      style={{ width: `${Math.max(pct, 1)}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs text-muted-foreground">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Assets by Type */}
        <div className="rounded-lg border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold">Assets by Type</h3>
          {data.assetsByType.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assets yet</p>
          ) : (
            <div className="space-y-2">
              {data.assetsByType.map((item) => (
                <div
                  key={item.type}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {item.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{item.count} assets</span>
                    <span className="font-medium">
                      avg: {Math.round(parseFloat(item.avgScore || '0'))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scan Activity */}
        <div className="rounded-lg border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold">
            Scan Activity (Last 30 Days)
          </h3>
          {data.scanActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No scan activity yet
            </p>
          ) : (
            <div className="flex items-end gap-1 h-24">
              {data.scanActivity.map((item) => {
                const max = Math.max(
                  ...data.scanActivity.map((s) => parseInt(s.count, 10)),
                  1,
                );
                const h = (parseInt(item.count, 10) / max) * 100;
                return (
                  <div
                    key={item.date}
                    className="flex-1 rounded-t bg-primary/70 hover:bg-primary transition-colors"
                    style={{ height: `${Math.max(h, 4)}%` }}
                    title={`${item.date}: ${item.count} scans`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top Threats Table */}
      <div className="mt-6 rounded-lg border">
        <div className="border-b bg-muted/50 px-4 py-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="size-4" />
            Top Threats
          </h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Value
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Type
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Threat Score
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Source
              </th>
            </tr>
          </thead>
          <tbody>
            {data.topThreats.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No high-severity threats detected yet
                </td>
              </tr>
            ) : (
              data.topThreats.map((asset) => (
                <tr key={asset.id} className="border-b last:border-0">
                  <td className="px-4 py-2.5 font-mono text-xs">
                    <Link
                      to="/cti/assets/$assetId"
                      params={{ assetId: asset.id }}
                      className="text-primary hover:underline"
                    >
                      {asset.value}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className="text-xs">
                      {asset.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`font-bold ${
                        asset.threatScore >= 80
                          ? 'text-red-600 dark:text-red-400'
                          : asset.threatScore >= 60
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-yellow-600 dark:text-yellow-400'
                      }`}
                    >
                      {asset.threatScore}
                    </span>
                    <span className="text-muted-foreground">/100</span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {asset.source ?? '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Recent Assets */}
      {data.recentAssets.length > 0 && (
        <div className="mt-6 rounded-lg border">
          <div className="border-b bg-muted/50 px-4 py-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Activity className="size-4" />
              Recent Assets (Last 7 Days)
            </h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Value
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Type
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Threat Score
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  First Seen
                </th>
              </tr>
            </thead>
            <tbody>
              {data.recentAssets.map((asset) => (
                <tr key={asset.id} className="border-b last:border-0">
                  <td className="px-4 py-2.5 font-mono text-xs">
                    <Link
                      to="/cti/assets/$assetId"
                      params={{ assetId: asset.id }}
                      className="text-primary hover:underline"
                    >
                      {asset.value}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className="text-xs">
                      {asset.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`font-bold ${
                        asset.threatScore >= 80
                          ? 'text-red-600 dark:text-red-400'
                          : asset.threatScore >= 60
                            ? 'text-orange-600 dark:text-orange-400'
                            : asset.threatScore >= 40
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-muted-foreground'
                      }`}
                    >
                      {asset.threatScore}
                    </span>
                    <span className="text-muted-foreground">/100</span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {new Date(asset.firstSeenAt).toLocaleDateString()}
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
