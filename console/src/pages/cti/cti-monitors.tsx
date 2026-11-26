import Page from '@/components/common/page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Loader2, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { axiosInstance } from '@/services/apis/axios-client';
import { useWorkspaceSelector } from '@/hooks/useWorkspaceSelector';

interface CtiMonitor {
  id: string;
  name: string;
  query: string;
  interval: string;
  isActive: boolean;
  alertCount: number;
  lastRunAt: string | null;
  createdAt: string;
}

interface MonitorAlert {
  id: string;
  changeType: string;
  summary: string | null;
  severity: string;
  entityCountDelta: number;
  createdAt: string;
  delivered: boolean;
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
};

export default function CtiMonitorsPage() {
  const { workspaces } = useWorkspaceSelector();
  const hasWorkspace = workspaces.length > 0;
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    query: '',
    interval: 'daily',
    deliveryChannels: { slack: false, telegram: false, webhook: '' },
  });

  const { data: monitors, isLoading } = useQuery({
    queryKey: ['cti-monitors'],
    queryFn: async () => {
      const res = await axiosInstance.get<CtiMonitor[]>('/api/cti-monitors');
      return res as unknown as CtiMonitor[];
    },
    enabled: hasWorkspace,
  });

  const { data: alerts } = useQuery({
    queryKey: ['cti-monitor-alerts', expandedId],
    queryFn: async () => {
      const res = await axiosInstance.get<MonitorAlert[]>(`/api/cti-monitors/${expandedId}/alerts`);
      return res as unknown as MonitorAlert[];
    },
    enabled: !!expandedId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const channels: Record<string, any> = {};
      if (form.deliveryChannels.slack) channels.slack = true;
      if (form.deliveryChannels.telegram) channels.telegram = true;
      if (form.deliveryChannels.webhook) channels.webhook = form.deliveryChannels.webhook;
      await axiosInstance.post('/api/cti-monitors', {
        name: form.name,
        query: form.query,
        interval: form.interval,
        deliveryChannels: channels,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cti-monitors'] });
      setShowCreate(false);
      setForm({ name: '', query: '', interval: 'daily', deliveryChannels: { slack: false, telegram: false, webhook: '' } });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/api/cti-monitors/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cti-monitors'] }),
  });

  return (
    <Page
      title={
        <div className="flex items-center gap-2">
          <Bell className="size-5" />
          <span>CTI Monitors</span>
          {monitors && <Badge variant="secondary">{monitors.length}</Badge>}
        </div>
      }
      description="Automated threat intelligence monitoring with alerting"
      permission="vulnerability.read"
      actions={
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="size-4 mr-1" /> New Monitor
        </Button>
      }
    >
      {/* Create Dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">New Monitor</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>✕</Button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Name</label>
                <input className="mt-1 w-full rounded border bg-background px-3 py-2 text-sm" placeholder="e.g. Ransomware Group Watch" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Query</label>
                <input className="mt-1 w-full rounded border bg-background px-3 py-2 text-sm" placeholder="e.g. ALPHV ransomware new victims" value={form.query} onChange={e => setForm(f => ({ ...f, query: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Interval</label>
                <select className="mt-1 w-full rounded border bg-background px-3 py-2 text-sm" value={form.interval} onChange={e => setForm(f => ({ ...f, interval: e.target.value }))}>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Delivery Channels</label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.deliveryChannels.slack} onChange={e => setForm(f => ({ ...f, deliveryChannels: { ...f.deliveryChannels, slack: e.target.checked } }))} />
                    Slack
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.deliveryChannels.telegram} onChange={e => setForm(f => ({ ...f, deliveryChannels: { ...f.deliveryChannels, telegram: e.target.checked } }))} />
                    Telegram
                  </label>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={!!form.deliveryChannels.webhook} onChange={e => setForm(f => ({ ...f, deliveryChannels: { ...f.deliveryChannels, webhook: e.target.checked ? '' : '' } }))} />
                    <input className="flex-1 rounded border bg-background px-2 py-1 text-sm" placeholder="Webhook URL (optional)" value={form.deliveryChannels.webhook} onChange={e => setForm(f => ({ ...f, deliveryChannels: { ...f.deliveryChannels, webhook: e.target.value } }))} />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button size="sm" onClick={() => createMutation.mutate()} disabled={!form.name || !form.query || createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Monitor'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" /> Loading monitors...
        </div>
      ) : !monitors || monitors.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 p-10 text-center text-sm text-muted-foreground">
          No monitors configured. Create one to automatically track threat intelligence queries.
        </div>
      ) : (
        <div className="space-y-2">
          {monitors.map((monitor) => (
            <div key={monitor.id} className="rounded-lg border bg-card">
              <div className="flex items-center gap-3 px-4 py-3">
                <button onClick={() => setExpandedId(expandedId === monitor.id ? null : monitor.id)} className="text-muted-foreground">
                  {expandedId === monitor.id ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{monitor.name}</span>
                    <Badge variant="outline" className="text-[10px]">{monitor.interval}</Badge>
                    {monitor.isActive ? (
                      <Badge variant="outline" className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] bg-gray-100 text-gray-700">paused</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground font-mono truncate">{monitor.query}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{monitor.alertCount} alerts</span>
                  <span>{monitor.lastRunAt ? new Date(monitor.lastRunAt).toLocaleDateString() : 'never run'}</span>
                </div>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(monitor.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>

              {expandedId === monitor.id && (
                <div className="border-t px-4 py-3">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">Recent Alerts</h4>
                  {!alerts || alerts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No alerts yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {alerts.map(alert => (
                        <div key={alert.id} className="flex items-start gap-2 rounded border px-3 py-2 text-sm">
                          <Badge variant="outline" className={`shrink-0 ${severityColors[alert.severity] ?? ''}`}>{alert.severity}</Badge>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{alert.changeType}</p>
                            {alert.summary && <p className="text-xs text-muted-foreground mt-0.5">{alert.summary}</p>}
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            <div>{new Date(alert.createdAt).toLocaleDateString()}</div>
                            {alert.entityCountDelta !== 0 && <div>Δ {alert.entityCountDelta} entities</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}
