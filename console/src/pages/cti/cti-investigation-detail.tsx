import Page from '@/components/common/page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useParams } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, CheckCircle2, Circle, Play, FileText, Globe, Brain, Network } from 'lucide-react';
import { useState } from 'react';
import { axiosInstance } from '@/services/apis/axios-client';

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
  // VoidAccess pipeline fields
  refinedQuery?: string;
  summary?: string;
  modelUsed?: string;
  sourcesUsed?: Record<string, any>;
  pageCount?: number;
  graphStatus?: string;
  communities?: Record<string, number>;
  currentStep?: number;
  currentStepLabel?: string;
  totalSteps?: number;
  relationshipCount?: number;
  entities: {
    id: string;
    value: string;
    type: string;
    threatScore: number;
    confidence: number;
    source: string | null;
    highSignal?: boolean;
    crossReferenced?: boolean;
    communityId?: number;
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

interface InvestigationPage {
  id: string;
  url: string;
  source: string | null;
  language: string | null;
  byteSize: number;
}

const pipelineSteps = [
  'Query refinement',
  'Seed URL loading',
  'Dark web search',
  'Threat feed enrichment',
  'Content extraction',
  'Entity extraction',
  'Enrichment (VT, HIBP, etc)',
  'Graph construction',
  'Community detection',
  'AI Summary',
];

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
    queryFn: async () => {
      const res = await axiosInstance.get<InvestigationDetail>(`/api/cti-investigations/${investigationId}`);
      return res as unknown as InvestigationDetail;
    },
    refetchInterval: (query) => {
      const s = (query.state.data as InvestigationDetail | undefined)?.status;
      return (s === 'running' || s === 'processing') ? 2000 : false;
    },
  });

  const queryClient = useQueryClient();

  const { data: progress } = useQuery({
    queryKey: ['cti-inv-progress', investigationId],
    queryFn: async () => {
      const res = await axiosInstance.get<{ current_step: number; current_step_label: string; total_steps: number; status: string; entity_count: number }>(`/api/cti-investigations/${investigationId}/progress`);
      return res as unknown as { current_step: number; current_step_label: string; total_steps: number; status: string; entity_count: number };
    },
    refetchInterval: (query) => {
      const s = (query.state.data as any)?.status;
      return (s === 'running' || s === 'processing') ? 2000 : false;
    },
    enabled: !!investigationId,
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await axiosInstance.post(`/api/cti-investigations/${investigationId}/cancel`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cti-investigation', investigationId] }),
  });

  const [activeTab, setActiveTab] = useState<'entities' | 'findings' | 'pages' | 'summary'>('entities');

  const { data: pages } = useQuery({
    queryKey: ['cti-investigation-pages', investigationId],
    queryFn: async () => {
      const res = await axiosInstance.get<InvestigationPage[]>(`/api/cti-investigations/${investigationId}/pages`);
      return res as unknown as InvestigationPage[];
    },
    enabled: !!investigation && activeTab === 'pages',
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
      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="rounded-lg border bg-card p-4 text-center">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Entities</span>
          <div className="mt-1 text-3xl font-bold text-primary">{investigation.totalEntities}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Relations</span>
          <div className="mt-1 text-3xl font-bold text-blue-600 dark:text-blue-400">{investigation.relationshipCount ?? 0}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pages</span>
          <div className="mt-1 text-3xl font-bold text-green-600 dark:text-green-400">{investigation.pageCount ?? 0}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Findings</span>
          <div className="mt-1 text-3xl font-bold text-red-600 dark:text-red-400">{findings.length}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Duration</span>
          <div className="mt-1 text-3xl font-bold text-muted-foreground">
            {investigation.startedAt && investigation.completedAt
              ? `${Math.round((new Date(investigation.completedAt).getTime() - new Date(investigation.startedAt).getTime()) / 1000)}s`
              : '-'}
          </div>
        </div>
      </div>

      {/* Pipeline Progress */}
      <div className="mt-6 rounded-lg border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Play className="size-4" /> Pipeline Progress
            {progress?.current_step_label && (
              <span className="text-xs font-normal text-muted-foreground">— {progress.current_step_label}</span>
            )}
          </h3>
          {(investigation.status === 'running' || investigation.status === 'processing') && (
            <Button
              size="sm"
              variant="outline"
              className="text-destructive border-destructive hover:bg-destructive/10"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
            </Button>
          )}
        </div>
        <div className="space-y-2">
          {pipelineSteps.slice(0, progress?.total_steps ?? investigation.totalSteps ?? 10).map((step, i) => {
            const currentStep = progress?.current_step ?? investigation.currentStep ?? 0;
            const isCompleted = investigation.status === 'completed' || i < currentStep;
            const isRunning = (investigation.status === 'running' || investigation.status === 'processing') && i === currentStep;
            return (
              <div key={i} className="flex items-center gap-3">
                {isCompleted ? (
                  <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                ) : isRunning ? (
                  <Loader2 className="size-4 text-blue-500 animate-spin shrink-0" />
                ) : (
                  <Circle className="size-4 text-muted-foreground/40 shrink-0" />
                )}
                <span className={`text-sm ${isCompleted ? 'text-foreground' : isRunning ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-muted-foreground/60'}`}>
                  Step {i}: {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Summary */}
      {investigation.summary && (
        <div className="mt-6 rounded-lg border bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold flex items-center gap-2">
            <Brain className="size-4" /> AI Summary
            {investigation.modelUsed && (
              <Badge variant="secondary" className="text-[10px] ml-2">{investigation.modelUsed}</Badge>
            )}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {investigation.summary}
          </p>
          {investigation.refinedQuery && investigation.refinedQuery !== investigation.query && (
            <div className="mt-3 text-xs text-muted-foreground">
              <span className="font-medium">Refined query:</span> {investigation.refinedQuery}
            </div>
          )}
        </div>
      )}

      {/* Sources Used */}
      {investigation.sourcesUsed && Object.keys(investigation.sourcesUsed).length > 0 && (
        <div className="mt-6 rounded-lg border bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold flex items-center gap-2">
            <Globe className="size-4" /> Sources Used
          </h3>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {Object.entries(investigation.sourcesUsed).map(([source, status]) => (
              <div key={source} className="rounded border px-3 py-2 text-xs">
                <span className="font-medium">{source}</span>
                <span className={`ml-2 ${String(status).startsWith('ok') ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                  {String(status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mt-6 flex gap-1 border-b">
        {(['entities', 'findings', 'pages', 'summary'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'entities' ? `Entities (${investigation.totalEntities})` :
             tab === 'findings' ? `Findings (${findings.length})` :
             tab === 'pages' ? `Pages (${investigation.pageCount ?? 0})` :
             'Summary'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'entities' && (
      <div className="mt-4">
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
                {entities.map((e: InvestigationDetail["entities"][number]) => (
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
      )}

      {activeTab === 'findings' && (
      <div className="mt-4">
        {findings.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            No findings associated with this investigation.
          </div>
        ) : (
          <div className="space-y-2">
            {findings.map((f: InvestigationDetail["findings"][number]) => (
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
      )}

      {activeTab === 'pages' && (
      <div className="mt-4">
        {!pages || pages.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            No pages scraped during this investigation.
          </div>
        ) : (
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">URL</th>
                  <th className="px-4 py-2 text-left font-medium">Source</th>
                  <th className="px-4 py-2 text-left font-medium">Language</th>
                  <th className="px-4 py-2 text-left font-medium">Size</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-mono text-xs max-w-md truncate">
                      {p.url}
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant="outline" className="text-[10px]">{p.source ?? 'unknown'}</Badge>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{p.language ?? '-'}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {p.byteSize > 0 ? `${(p.byteSize / 1024).toFixed(1)} KB` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {activeTab === 'summary' && (
      <div className="mt-4 space-y-4">
        <div className="rounded-lg border bg-card p-5">
          <h4 className="text-sm font-semibold mb-2">Investigation Details</h4>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Query</dt><dd className="font-mono text-xs">{investigation.query}</dd></div>
            {investigation.refinedQuery && <div className="flex justify-between"><dt className="text-muted-foreground">Refined Query</dt><dd className="font-mono text-xs">{investigation.refinedQuery}</dd></div>}
            <div className="flex justify-between"><dt className="text-muted-foreground">Model</dt><dd>{investigation.modelUsed ?? 'N/A'}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Graph Status</dt><dd>{investigation.graphStatus ?? 'N/A'}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Entity Count</dt><dd>{investigation.entityCount}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Relationship Count</dt><dd>{investigation.relationshipCount ?? 0}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Pages Scraped</dt><dd>{investigation.pageCount ?? 0}</dd></div>
          </dl>
        </div>
        {investigation.communities && Object.keys(investigation.communities).length > 0 && (
          <div className="rounded-lg border bg-card p-5">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><Network className="size-4" /> Communities</h4>
            <div className="text-sm text-muted-foreground">
              {Object.entries(investigation.communities).length} community clusters detected
            </div>
          </div>
        )}
      </div>
      )}
    </Page>
  );
}
