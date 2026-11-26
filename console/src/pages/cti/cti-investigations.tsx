import Page from '@/components/common/page';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Search, Plus } from 'lucide-react';
import { axiosInstance } from '@/services/apis/axios-client';
import { useWorkspaceSelector } from '@/hooks/useWorkspaceSelector';
import CreateWorkspace from '@/pages/workspaces/create-workspace';

interface CtiInvestigation {
  id: string;
  query: string;
  status: string;
  entityCount: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  running: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

export default function CtiInvestigationsPage() {
  const { workspaces } = useWorkspaceSelector();
  const hasWorkspace = workspaces.length > 0;

  const { data, isLoading } = useQuery({
    queryKey: ['cti-investigations'],
    queryFn: async () => {
      const res = await axiosInstance.get<{ items: CtiInvestigation[]; total: number }>('/api/cti-investigations');
      return res as unknown as { items: CtiInvestigation[]; total: number };
    },
    enabled: hasWorkspace,
  });

  if (!hasWorkspace) {
    const [showCreate, setShowCreate] = useState(false);
  const [newQuery, setNewQuery] = useState('');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (query: string) => {
      const res = await axiosInstance.post('/api/cti-investigations', { query });
      return res as unknown as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cti-investigations'] });
      setShowCreate(false);
      setNewQuery('');
    },
  });

  return (
      <Page title="CTI Investigations" permission="vulnerability.read"
      action={<Button size="sm" onClick={() => setShowCreate(true)}><Plus className="mr-1.5 size-4" />New Investigation</Button>}>
        <CreateWorkspace />
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Investigation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Query</Label>
              <Input
                placeholder="e.g., lockbit ransomware, company.com"
                value={newQuery}
                onChange={(e) => setNewQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && newQuery.trim() && createMutation.mutate(newQuery.trim())}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Enter a search query for deep dark web investigation. VoidAccess will search across Tor, threat feeds, and OSINT sources.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              onClick={() => newQuery.trim() && createMutation.mutate(newQuery.trim())}
              disabled={!newQuery.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Starting...' : 'Start Investigation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
    );
  }

  const investigations = data?.items ?? [];

  return (
    <Page
      title="CTI Investigations"
      description="Deep threat intelligence investigation results"
      permission="vulnerability.read"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading...
        </div>
      ) : investigations.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 p-12 text-center">
          <Search className="mx-auto mb-3 size-10 text-muted-foreground/40" />
          <p className="text-lg font-medium">No investigations yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Investigations are created when you run deep scans on CTI targets.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Query</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Entities</th>
                <th className="px-4 py-3 text-left font-medium">Started</th>
                <th className="px-4 py-3 text-left font-medium">Completed</th>
              </tr>
            </thead>
            <tbody>
              {investigations.map((inv: CtiInvestigation) => (
                <tr key={inv.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      to="/cti/investigations/$investigationId"
                      params={{ investigationId: inv.id }}
                      className="text-primary hover:underline"
                    >
                      {inv.query}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={statusColors[inv.status] ?? ''}
                    >
                      {inv.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{inv.entityCount}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {inv.startedAt
                      ? new Date(inv.startedAt).toLocaleString()
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {inv.completedAt
                      ? new Date(inv.completedAt).toLocaleString()
                      : '-'}
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
