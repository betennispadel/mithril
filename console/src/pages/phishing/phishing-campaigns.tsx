import Page from '@/components/common/page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useSearch } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Play, Trash2, Eye, Fish } from 'lucide-react';
import {
  getPhishingCampaigns,
  launchPhishingCampaign,
  deletePhishingCampaign,
  type PhishingCampaign,
} from './api';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  running: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

export default function PhishingCampaigns() {
  const search = useSearch({ from: '/_authed/phishing/' });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['phishing-campaigns', search.status, search.page],
    queryFn: () =>
      getPhishingCampaigns({
        status: search.status,
        page: search.page,
        pageSize: search.pageSize ?? 20,
      }),
    refetchInterval: 5000,
  });

  const launchMutation = useMutation({
    mutationFn: launchPhishingCampaign,
    onSuccess: () => {
      toast.success('Campaign launched successfully');
      queryClient.invalidateQueries({ queryKey: ['phishing-campaigns'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to launch campaign');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePhishingCampaign,
    onSuccess: () => {
      toast.success('Campaign deleted');
      queryClient.invalidateQueries({ queryKey: ['phishing-campaigns'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to delete campaign');
    },
  });

  const campaigns = data?.items ?? [];

  return (
    <Page
      title="Imperius"
      description="Phishing simulation campaigns to test employee security awareness."
      action={
        <Link to="/phishing/new">
          <Button size="sm">
            <Plus className="mr-1.5 size-4" />
            New Campaign
          </Button>
        </Link>
      }
    >
      {isLoading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading campaigns...
        </div>
      )}

      {!isLoading && campaigns.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-20 text-center">
          <Fish className="size-12 text-muted-foreground/40" />
          <div>
            <p className="text-lg font-medium">No campaigns yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first phishing simulation campaign
            </p>
          </div>
          <Link to="/phishing/new">
            <Button size="sm">
              <Plus className="mr-1.5 size-4" />
              Create Campaign
            </Button>
          </Link>
        </div>
      )}

      {!isLoading && campaigns.length > 0 && (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Target</th>
                <th className="px-4 py-3 text-left font-medium">Recipients</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Results</th>
                <th className="px-4 py-3 text-left font-medium">Created</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c: PhishingCampaign) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      to="/phishing/$campaignId"
                      params={{ campaignId: c.id }}
                      className="font-medium text-primary hover:underline"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.target}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.recipientCount}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={statusColors[c.status] ?? ''}>
                      {c.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {c.status !== 'draft' && (
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span title="Opened">{c.emailsOpened} opened</span>
                        <span title="Clicked">{c.linksClicked} clicked</span>
                        <span title="Submitted" className="text-destructive">
                          {c.credsSubmitted} creds
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link to="/phishing/$campaignId" params={{ campaignId: c.id }}>
                        <Button variant="ghost" size="icon" className="size-8">
                          <Eye className="size-4" />
                        </Button>
                      </Link>
                      {c.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-blue-600"
                          onClick={() => launchMutation.mutate(c.id)}
                          disabled={launchMutation.isPending}
                        >
                          <Play className="size-4" />
                        </Button>
                      )}
                      {c.status !== 'running' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive"
                          onClick={() => {
                            if (confirm('Delete this campaign?')) {
                              deleteMutation.mutate(c.id);
                            }
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
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
