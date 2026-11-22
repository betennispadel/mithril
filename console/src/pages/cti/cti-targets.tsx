import Page from '@/components/common/page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw, Trash2, Crosshair } from 'lucide-react';
import { axiosInstance } from '@/services/apis/axios-client';
import { toast } from 'sonner';
import { useWorkspaceSelector } from '@/hooks/useWorkspaceSelector';
import CreateWorkspace from '@/pages/workspaces/create-workspace';

interface CtiTarget {
  id: string;
  value: string;
  type: string;
  label: string | null;
  source: string;
  scanSchedule: string;
  lastScanAt: string | null;
  isEnabled: boolean;
  createdAt: string;
}

const typeColors: Record<string, string> = {
  DOMAIN: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  IP: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  EMAIL: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  USERNAME: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
  KEYWORD: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  CRYPTO_WALLET: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  ORGANIZATION: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  THREAT_ACTOR: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  FILE_HASH: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  CVE: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  TELEGRAM_CHANNEL: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
  URL: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  ONION: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
  ASN: 'bg-lime-100 text-lime-700 dark:bg-lime-900 dark:text-lime-300',
  PHONE: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
  APP_PACKAGE: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
};

export default function CtiTargetsPage() {
  const { workspaces } = useWorkspaceSelector();
  const hasWorkspace = workspaces.length > 0;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['cti-targets'],
    queryFn: () =>
      axiosInstance
        .get<{ items: CtiTarget[]; total: number }>('/api/cti-targets')
        .then((r) => r.data),
    enabled: hasWorkspace,
  });

  const rescanMutation = useMutation({
    mutationFn: (id: string) =>
      axiosInstance.post(`/api/cti-targets/${id}/scan`),
    onSuccess: () => {
      toast.success('Scan triggered');
      queryClient.invalidateQueries({ queryKey: ['cti-targets'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      axiosInstance.delete(`/api/cti-targets/${id}`),
    onSuccess: () => {
      toast.success('Target deleted');
      queryClient.invalidateQueries({ queryKey: ['cti-targets'] });
    },
  });

  if (!hasWorkspace) {
    return (
      <Page title="CTI Targets" permission="vulnerability.read">
        <CreateWorkspace />
      </Page>
    );
  }

  const targets = data?.items ?? [];

  return (
    <Page
      title="CTI Targets"
      description="Manage threat intelligence targets for automated scanning"
      permission="vulnerability.read"
      action={
        <Link to="/cti/start-discovery">
          <Button>
            <Plus className="mr-1.5 size-4" />
            Start Discovery
          </Button>
        </Link>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading...
        </div>
      ) : targets.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 p-12 text-center">
          <Crosshair className="mx-auto mb-3 size-10 text-muted-foreground/40" />
          <p className="text-lg font-medium">No CTI targets yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Start a discovery to begin monitoring domains, emails, keywords,
            and other threat intelligence targets.
          </p>
          <Link to="/cti/start-discovery">
            <Button className="mt-4">
              <Plus className="mr-1.5 size-4" />
              Start Discovery
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Value</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Source</th>
                <th className="px-4 py-3 text-left font-medium">Schedule</th>
                <th className="px-4 py-3 text-left font-medium">Last Scan</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {targets.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      to="/cti/$targetId"
                      params={{ targetId: t.id }}
                      className="text-primary hover:underline"
                    >
                      {t.label || t.value}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={typeColors[t.type] ?? ''}
                    >
                      {t.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.source}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.scanSchedule === 'disabled'
                      ? 'Manual'
                      : t.scanSchedule}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.lastScanAt
                      ? new Date(t.lastScanAt).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={
                        t.isEnabled
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-gray-100 text-gray-500'
                      }
                    >
                      {t.isEnabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => rescanMutation.mutate(t.id)}
                        disabled={rescanMutation.isPending}
                      >
                        <RefreshCw className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        onClick={() => deleteMutation.mutate(t.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="size-4" />
                      </Button>
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
