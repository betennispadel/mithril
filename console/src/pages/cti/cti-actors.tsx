import Page from '@/components/common/page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Loader2, ChevronRight } from 'lucide-react';
import { axiosInstance } from '@/services/apis/axios-client';
import { useWorkspaceSelector } from '@/hooks/useWorkspaceSelector';

interface ActorProfile {
  id: string;
  handle: string;
  aliases: string[];
  confidence: number;
  sampleCount: number;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  notes: string[];
  summary: string | null;
}

export default function CtiActorsPage() {
  const { workspaces } = useWorkspaceSelector();
  const hasWorkspace = workspaces.length > 0;
  const queryClient = useQueryClient();

  const [selectedActor, setSelectedActor] = useState<ActorProfile | null>(null);
  const [mergeHandle, setMergeHandle] = useState('');
  const [noteText, setNoteText] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['cti-actors'],
    queryFn: async () => {
      const res = await axiosInstance.get<{ data: ActorProfile[]; total: number }>('/api/cti-actors');
      return res as unknown as { data: ActorProfile[]; total: number };
    },
    enabled: hasWorkspace,
  });

  const mergeMutation = useMutation({
    mutationFn: async ({ primary, secondary }: { primary: string; secondary: string }) => {
      await axiosInstance.post(`/api/cti-actors/${encodeURIComponent(primary)}/merge`, { secondary_handle: secondary });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cti-actors'] });
      setMergeHandle('');
      setSelectedActor(null);
    },
  });

  const noteMutation = useMutation({
    mutationFn: async ({ handle, text }: { handle: string; text: string }) => {
      await axiosInstance.post(`/api/cti-actors/${encodeURIComponent(handle)}/note`, { text });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cti-actors'] });
      setNoteText('');
    },
  });

  const actors = data?.data ?? [];

  return (
    <Page
      title={
        <div className="flex items-center gap-2">
          <Users className="size-5" />
          <span>Threat Actors</span>
          {data && <Badge variant="secondary">{data.total}</Badge>}
        </div>
      }
      description="Actor profiles built from intelligence relationships"
      permission="vulnerability.read"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" /> Loading actors...
        </div>
      ) : actors.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 p-10 text-center text-sm text-muted-foreground">
          No actor profiles yet. They are built automatically from LIKELY_SAME_ACTOR and CONFIRMED_SAME_ACTOR relationships in investigations.
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left font-medium">Handle</th>
                <th className="px-4 py-2 text-left font-medium">Aliases</th>
                <th className="px-4 py-2 text-left font-medium">Confidence</th>
                <th className="px-4 py-2 text-left font-medium">Samples</th>
                <th className="px-4 py-2 text-left font-medium">First Seen</th>
                <th className="px-4 py-2 text-left font-medium">Last Seen</th>
                <th className="px-4 py-2 text-left font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {actors.map((actor) => (
                <tr key={actor.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2 font-mono font-medium">{actor.handle}</td>
                  <td className="px-4 py-2">
                    {actor.aliases.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {actor.aliases.slice(0, 3).map((a) => (
                          <Badge key={a} variant="outline" className="text-[10px]">{a}</Badge>
                        ))}
                        {actor.aliases.length > 3 && <Badge variant="secondary" className="text-[10px]">+{actor.aliases.length - 3}</Badge>}
                      </div>
                    ) : <span className="text-muted-foreground">-</span>}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`font-bold ${actor.confidence >= 0.8 ? 'text-green-600' : actor.confidence >= 0.5 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                      {(actor.confidence * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{actor.sampleCount}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {actor.firstSeenAt ? new Date(actor.firstSeenAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {actor.lastSeenAt ? new Date(actor.lastSeenAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedActor(actor)}>
                      <ChevronRight className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Actor Detail Dialog */}
      {selectedActor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold font-mono">{selectedActor.handle}</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedActor(null)}>✕</Button>
            </div>

            <div className="space-y-4">
              {selectedActor.aliases.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase mb-1">Aliases</h3>
                  <div className="flex flex-wrap gap-1">
                    {selectedActor.aliases.map(a => <Badge key={a} variant="outline">{a}</Badge>)}
                  </div>
                </div>
              )}

              {selectedActor.notes.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase mb-1">Notes</h3>
                  <div className="space-y-1 text-sm text-muted-foreground max-h-32 overflow-y-auto">
                    {selectedActor.notes.map((n, i) => <p key={i}>{n}</p>)}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase mb-1">Add Note</h3>
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded border bg-background px-2 py-1 text-sm"
                    placeholder="Note text..."
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                  />
                  <Button size="sm" onClick={() => noteMutation.mutate({ handle: selectedActor.handle, text: noteText })} disabled={!noteText}>
                    Add
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase mb-1">Merge with Secondary Actor</h3>
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded border bg-background px-2 py-1 text-sm"
                    placeholder="Secondary actor handle..."
                    value={mergeHandle}
                    onChange={e => setMergeHandle(e.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => mergeMutation.mutate({ primary: selectedActor.handle, secondary: mergeHandle })}
                    disabled={!mergeHandle}
                  >
                    Merge
                  </Button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">The secondary actor will be absorbed into this profile.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
