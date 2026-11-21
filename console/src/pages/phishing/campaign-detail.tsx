import Page from '@/components/common/page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useParams } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Play,
  Mail,
  MousePointerClick,
  Eye,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import {
  getPhishingCampaign,
  getPhishingCampaignResults,
  launchPhishingCampaign,
  type PhishingCampaign,
  type PhishingFinding,
} from './api';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  running: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const severityColors: Record<string, string> = {
  info: 'text-blue-600 dark:text-blue-400',
  low: 'text-green-600 dark:text-green-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  high: 'text-orange-600 dark:text-orange-400',
  critical: 'text-red-600 dark:text-red-400',
};

function StatCard({
  icon: Icon,
  label,
  value,
  total,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className={`size-4 ${color}`} />
        <span className="text-xs font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`text-3xl font-bold ${color}`}>{value}</span>
        <span className="text-sm text-muted-foreground">/ {total}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${color.replace('text-', 'bg-')}`}
          style={{ width: `${Math.min(parseFloat(pct), 100)}%` }}
        />
      </div>
      <span className="mt-1 text-xs text-muted-foreground">{pct}%</span>
    </div>
  );
}

function FunnelBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-right text-sm text-muted-foreground">
        {label}
      </span>
      <div className="flex-1">
        <div className="h-8 overflow-hidden rounded bg-muted">
          <div
            className={`flex h-full items-center rounded px-2 text-xs font-medium text-white transition-all ${color}`}
            style={{ width: `${Math.max(pct, 2)}%` }}
          >
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function findingIcon(tags: string[]) {
  if (tags.includes('credential-harvest')) return '🔑';
  if (tags.includes('link-clicked')) return '🖱️';
  if (tags.includes('email-opened')) return '👁️';
  if (tags.includes('email-reported')) return '🛡️';
  if (tags.includes('simulation-summary')) return '📊';
  return '📧';
}

export default function CampaignDetail() {
  const { campaignId } = useParams({ from: '/_authed/phishing/$campaignId' });
  const queryClient = useQueryClient();

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['phishing-campaign', campaignId],
    queryFn: () => getPhishingCampaign(campaignId),
    refetchInterval: (query) =>
      query.state.data?.status === 'running' ? 5000 : false,
  });

  const { data: resultsData } = useQuery({
    queryKey: ['phishing-results', campaignId],
    queryFn: () => getPhishingCampaignResults(campaignId),
    enabled: campaign?.status !== 'draft',
    refetchInterval: (query) =>
      campaign?.status === 'running' ? 5000 : false,
  });

  const launchMutation = useMutation({
    mutationFn: launchPhishingCampaign,
    onSuccess: () => {
      toast.success('Campaign launched!');
      queryClient.invalidateQueries({ queryKey: ['phishing-campaign', campaignId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to launch');
    },
  });

  if (isLoading || !campaign) {
    return (
      <Page title="Campaign">
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading...
        </div>
      </Page>
    );
  }

  const findings = resultsData?.findings ?? [];
  const eventFindings = findings.filter(
    (f: PhishingFinding) => !f.tags?.includes('simulation-summary'),
  );
  const total = campaign.emailsSent || campaign.recipientCount;

  return (
    <Page
      title={
        <div className="flex items-center gap-3">
          <Link to="/phishing">
            <Button variant="ghost" size="icon" className="size-8">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <span>{campaign.name}</span>
          <Badge
            variant="outline"
            className={statusColors[campaign.status] ?? ''}
          >
            {campaign.status}
          </Badge>
        </div>
      }
      description={`Target: ${campaign.target} · ${campaign.recipientCount} recipients · ${campaign.durationMinutes} min · Template: ${campaign.templatePreset}`}
      action={
        campaign.status === 'draft' ? (
          <Button
            onClick={() => launchMutation.mutate(campaignId)}
            disabled={launchMutation.isPending}
          >
            <Play className="mr-1.5 size-4" />
            {launchMutation.isPending ? 'Launching...' : 'Launch Campaign'}
          </Button>
        ) : undefined
      }
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard
          icon={Mail}
          label="Sent"
          value={campaign.emailsSent}
          total={campaign.recipientCount}
          color="text-gray-600 dark:text-gray-400"
        />
        <StatCard
          icon={Eye}
          label="Opened"
          value={campaign.emailsOpened}
          total={total}
          color="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          icon={MousePointerClick}
          label="Clicked"
          value={campaign.linksClicked}
          total={total}
          color="text-yellow-600 dark:text-yellow-400"
        />
        <StatCard
          icon={KeyRound}
          label="Credentials"
          value={campaign.credsSubmitted}
          total={total}
          color="text-red-600 dark:text-red-400"
        />
        <StatCard
          icon={ShieldAlert}
          label="Reported"
          value={campaign.emailsReported}
          total={total}
          color="text-green-600 dark:text-green-400"
        />
      </div>

      {/* Funnel + Timeline */}
      {campaign.status !== 'draft' && (
        <div className="mt-6 grid grid-cols-2 gap-6">
          {/* Funnel */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Campaign Funnel
            </h3>
            <div className="space-y-3">
              <FunnelBar
                label="Sent"
                value={campaign.emailsSent}
                max={campaign.recipientCount}
                color="bg-gray-500"
              />
              <FunnelBar
                label="Opened"
                value={campaign.emailsOpened}
                max={total}
                color="bg-blue-500"
              />
              <FunnelBar
                label="Clicked"
                value={campaign.linksClicked}
                max={total}
                color="bg-yellow-500"
              />
              <FunnelBar
                label="Submitted"
                value={campaign.credsSubmitted}
                max={total}
                color="bg-red-500"
              />
              <FunnelBar
                label="Reported"
                value={campaign.emailsReported}
                max={total}
                color="bg-green-500"
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Event Timeline
            </h3>
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {eventFindings.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {campaign.status === 'running'
                    ? 'Waiting for events...'
                    : 'No events recorded'}
                </p>
              )}
              {eventFindings.map((f: PhishingFinding) => (
                <div
                  key={f.id}
                  className="flex items-start gap-3 rounded-md border px-3 py-2 text-sm"
                >
                  <span className="mt-0.5 text-base">
                    {findingIcon(f.tags)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{f.name}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${severityColors[f.severity]}`}
                      >
                        {f.severity}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {f.matchedAt} — {f.description}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(f.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Draft info */}
      {campaign.status === 'draft' && (
        <div className="mt-6 rounded-lg border border-dashed bg-muted/30 p-8 text-center">
          <Play className="mx-auto mb-3 size-10 text-muted-foreground/40" />
          <p className="text-lg font-medium">Campaign is ready</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Click &quot;Launch Campaign&quot; to start sending phishing
            simulation emails to {campaign.recipientCount} recipients.
          </p>
        </div>
      )}
    </Page>
  );
}
