import Page from '@/components/common/page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { axiosInstance } from '@/services/apis/axios-instance';

interface InvestigationDetail {
  id: string;
  query: string;
  status: string;
  entityCount: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  metadata: Record<string, any>;
  ctiTarget: { id: string; value: string; type: string } | null;
  entities: {
    id: string;
    value: string;
    type: string;
    threatScore: number;
    confidence: number;
    source: string | null;
  }[];
  totalEntities: number;
  findings: {
    id: string;
    name: string;
    severity: string;
    description: string;
    tags: string[];
    matchedAt: string;
    createdAt: string;
  }[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  running: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const severityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  info: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export default function CtiInvestigationDetailPage() {
  const { investigationId } = useParams({
    from: '/_authed/cti/investigations/$investigationId',
  });

  const { data: investigation, isLoading } = useQuery({
    queryKey: ['cti-investigation', investigationId],
    queryFn: () =>
      axiosInstance
        .get<InvestigationDetail>(`/cti-investigations/${investigationId}`)
        .then((r) => r.data),
    refetchInterval: (query) =>
      query.state.data?.status === 'running' ? 5000 : false,
  });

  if (isLoading || !investigation) {
    return (
      <Page title="Investigation">
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" /> Loading...
        </div>
      </Page>
    );
  }

  const entities = investigation.entities ?? [];
  const findings = investigation.findings ?? [];

  return (
    <Page
      title={
        <div className="flex items-center gap-3">
          <Link to="/cti/investigations">
            <Button variant="ghost" size="icon" className="size-8">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <span>Investigation: {investigation.query}</span>
          <Badge
            variant="outline"
            className={statusColors[investigation.status] ?? ''}
          >
            {investigation.status}
          </Badge>
        </div>
      }
      description={`Target: ${investigation.ctiTarget?.value ?? 'N/A'} | Started: ${investigation.startedAt ? new Date(investigation.startedAt).toLocaleString() : '-'} | Completed: ${investigation.completedAt ? new Date(investigation.completedAt).toLocaleString() : '-'}`}
      permission="vulnerability.read"
    >
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4 text-center">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Entities
          </span>
          <div className="mt-1 text-3xl font-bold text-primary">
            {investigation.totalEntities}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Findings
          </span>
          <div className="mt-1 text-3xl font-bold text-red-600 dark:text-red-400">
            {findings.length}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Duration
          </span>
          <div className="mt-1 text-3xl font-bold text-muted-foreground">
            {investigation.startedAt && investigation.completedAt
              ? `${Math.round(
                  (new Date(investigation.completedAt).getTime() -
                    new Date(investigation.startedAt).getTime()) /
                    1000,
                )}s`
              : '-'}
          </div>
        </div>
      </div>

      {/* Entities */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Discovered Entities ({investigation.totalEntities})
        </h3>
        {entities.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            {investigation.status === 'running'
              ? 'Scanning... entities will appear as they are discovered.'
              : 'No entities discovered.'}
          </div>
        ) : (
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">Value</th>
                  <th className="px-4 py-2 text-left font-medium">Type</th>
                  <th className="px-4 py-2 text-left font-medium">Threat</th>
                  <th className="px-4 py-2 text-left font-medium">Confidence</th>
                  <th className="px-4 py-2 text-left font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {entities.map((e) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="px-4 py-2">
                      <Link
                        to="/cti/assets/$assetId"
                        params={{ assetId: e.id }}
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {e.value}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant="outline">{e.type}</Badge>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`font-bold ${
                          e.threatScore >= 80
                            ? 'text-red-600'
                            : e.threatScore >= 60
                              ? 'text-orange-600'
                              : 'text-gray-500'
                        }`}
                      >
                        {e.threatScore}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {(e.confidence * 100).toFixed(0)}%
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {e.source ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Findings */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Related Findings ({findings.length})
        </h3>
        {findings.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            No findings associated with this investigation.
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
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(f.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}
