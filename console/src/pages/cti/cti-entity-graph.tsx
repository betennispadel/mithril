import Page from '@/components/common/page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { GitBranch, ZoomIn, ZoomOut, Maximize2, Search } from 'lucide-react';
import { axiosInstance } from '@/services/apis/axios-client';
import { useWorkspaceSelector } from '@/hooks/useWorkspaceSelector';
import CreateWorkspace from '@/pages/workspaces/create-workspace';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

/* ── Community colors (matches VoidAccess sigma.js palette) ── */
const COMMUNITY_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#a855f7',
  '#6366f1', '#84cc16', '#e11d48', '#0ea5e9', '#d946ef',
];

const TYPE_COLORS: Record<string, string> = {
  DOMAIN: '#3b82f6', IP: '#f97316', EMAIL: '#a855f7',
  URL: '#14b8a6', FILE_HASH: '#6b7280', CRYPTO_WALLET: '#10b981',
  THREAT_ACTOR: '#ef4444', ORGANIZATION: '#6366f1', CVE: '#f59e0b',
  ASN: '#84cc16', ONION: '#8b5cf6', USERNAME: '#ec4899',
  MALWARE: '#dc2626', RANSOMWARE_GROUP: '#b91c1c',
  MITRE_TECHNIQUE: '#7c3aed', KEYWORD: '#eab308',
};

/* ── Types ── */
interface VoidAccessNode {
  id: string;
  label?: string;
  type?: string;
  entity_type?: string;
  value?: string;
  threat_score?: number;
  priority_score?: number;
  confidence?: number;
  community?: number;
  size?: number;
  color?: string;
  [key: string]: any;
}

interface VoidAccessEdge {
  id?: string;
  source: string;
  target: string;
  from?: string;
  to?: string;
  label?: string;
  relation_type?: string;
  weight?: number;
  [key: string]: any;
}

interface VoidAccessGraphData {
  status: string;
  graph: {
    nodes: VoidAccessNode[];
    edges: VoidAccessEdge[];
    communities: Record<string, number>;
    node_count: number;
    edge_count: number;
  } | null;
}

interface Investigation {
  id: string;
  query: string;
  status: string;
  graphStatus?: string;
  createdAt: string;
}

interface LayoutNode extends VoidAccessNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  displayLabel: string;
  nodeColor: string;
  radius: number;
}

/* ── Helpers ── */
function getNodeColor(node: VoidAccessNode, communities: Record<string, number>): string {
  // 1. If VoidAccess assigned a color, use it
  if (node.color && node.color !== '#000000') return node.color;
  // 2. Use community color
  const comm = node.community ?? communities[node.id ?? ''];
  if (comm != null) return COMMUNITY_COLORS[comm % COMMUNITY_COLORS.length];
  // 3. Fall back to type color
  const t = (node.type || node.entity_type || '').toUpperCase();
  return TYPE_COLORS[t] || '#6b7280';
}

function getNodeRadius(node: VoidAccessNode): number {
  if (node.size && node.size > 1) return Math.min(6 + node.size * 2, 20);
  const score = node.threat_score ?? node.priority_score ?? 0;
  if (score >= 80) return 14;
  if (score >= 60) return 12;
  if (score >= 40) return 10;
  return 8;
}

function getNodeLabel(node: VoidAccessNode): string {
  const val = node.label || node.value || node.id || '';
  return val.length > 28 ? val.slice(0, 25) + '...' : val;
}

/* ── Force simulation ── */
function simulateForces(nodes: LayoutNode[], edges: VoidAccessEdge[], iterations = 120): void {
  const W = 900, H = 600;
  for (const n of nodes) {
    n.x = W / 2 + (Math.random() - 0.5) * W * 0.6;
    n.y = H / 2 + (Math.random() - 0.5) * H * 0.6;
    n.vx = 0; n.vy = 0;
  }
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations;
    const repulsion = 6000 * alpha;
    const attraction = 0.004 * alpha;
    const center = 0.01 * alpha;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        let dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const f = repulsion / (dist * dist);
        dx = dx / dist * f; dy = dy / dist * f;
        a.vx += dx; a.vy += dy; b.vx -= dx; b.vy -= dy;
      }
    }
    for (const edge of edges) {
      const src = edge.source || edge.from;
      const tgt = edge.target || edge.to;
      const s = nodeMap.get(src!), t = nodeMap.get(tgt!);
      if (!s || !t) continue;
      const dx = t.x - s.x, dy = t.y - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const f = dist * attraction;
      s.vx += dx * f; s.vy += dy * f;
      t.vx -= dx * f; t.vy -= dy * f;
    }
    for (const n of nodes) {
      n.vx += (W / 2 - n.x) * center;
      n.vy += (H / 2 - n.y) * center;
      n.vx *= 0.6; n.vy *= 0.6;
      n.x += n.vx; n.y += n.vy;
      n.x = Math.max(30, Math.min(W - 30, n.x));
      n.y = Math.max(30, Math.min(H - 30, n.y));
    }
  }
}

/* ── Component ── */
export default function CtiEntityGraphPage() {
  const { workspaces } = useWorkspaceSelector();
  const hasWorkspace = workspaces.length > 0;
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<LayoutNode | null>(null);
  const [selectedInvId, setSelectedInvId] = useState<string>('');
  const [communityFilter, setCommunityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);

  /* Fetch investigations list */
  const { data: investigations } = useQuery({
    queryKey: ['cti-investigations-list'],
    queryFn: async () => {
      const res = await axiosInstance.get<{ data: Investigation[] }>('/api/cti-investigations?limit=50&sort=createdAt:DESC');
      return (res as unknown as { data: Investigation[] }).data;
    },
    enabled: hasWorkspace,
  });

  /* Auto-select first investigation with graph */
  useEffect(() => {
    if (!selectedInvId && investigations?.length) {
      const withGraph = investigations.find(i => i.graphStatus === 'completed') || investigations[0];
      setSelectedInvId(withGraph.id);
    }
  }, [investigations, selectedInvId]);

  /* Fetch VoidAccess graph data */
  const { data: graphResponse, isLoading } = useQuery({
    queryKey: ['cti-investigation-graph', selectedInvId],
    queryFn: async () => {
      const res = await axiosInstance.get<VoidAccessGraphData>(`/api/cti-investigations/${selectedInvId}/graph`);
      return res as unknown as VoidAccessGraphData;
    },
    enabled: hasWorkspace && !!selectedInvId,
  });

  /* Layout */
  const [layoutNodes, setLayoutNodes] = useState<LayoutNode[]>([]);
  const [layoutEdges, setLayoutEdges] = useState<VoidAccessEdge[]>([]);
  const [communityList, setCommunityList] = useState<number[]>([]);

  useEffect(() => {
    if (!graphResponse?.graph?.nodes?.length) {
      setLayoutNodes([]);
      setLayoutEdges([]);
      setCommunityList([]);
      return;
    }
    const g = graphResponse.graph;
    const communities = g.communities || {};

    // Build layout nodes from VoidAccess data
    const nodes: LayoutNode[] = g.nodes.map(n => ({
      ...n,
      id: String(n.id),
      x: 0, y: 0, vx: 0, vy: 0,
      displayLabel: getNodeLabel(n),
      nodeColor: getNodeColor(n, communities),
      radius: getNodeRadius(n),
      community: n.community ?? communities[String(n.id)],
    }));

    // Normalize edges
    const edges = g.edges.map((e, i) => ({
      ...e,
      id: e.id || `edge-${i}`,
      source: String(e.source || e.from),
      target: String(e.target || e.to),
    }));

    simulateForces(nodes, edges);
    setLayoutNodes(nodes);
    setLayoutEdges(edges);

    // Collect unique communities
    const comms = new Set<number>();
    nodes.forEach(n => { if (n.community != null) comms.add(n.community); });
    setCommunityList(Array.from(comms).sort((a, b) => a - b));
  }, [graphResponse]);

  /* Filtering */
  const filteredNodes = layoutNodes.filter(n => {
    if (communityFilter !== 'all' && String(n.community) !== communityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const val = (n.label || n.value || n.id || '').toLowerCase();
      if (!val.includes(q)) return false;
    }
    return true;
  });
  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = layoutEdges.filter(e =>
    filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
  );
  const nodeMap = new Map(filteredNodes.map(n => [n.id, n]));

  const handleZoomIn = useCallback(() => setZoom(z => Math.min(z * 1.3, 4)), []);
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(z / 1.3, 0.3)), []);
  const handleReset = useCallback(() => { setZoom(1); setSelectedNode(null); }, []);

  if (!hasWorkspace) {
    return (
      <Page title="Entity Graph" permission="vulnerability.read">
        <CreateWorkspace />
      </Page>
    );
  }

  const graphData = graphResponse?.graph;

  return (
    <Page
      title="Entity Graph"
      description="VoidAccess investigation graph with community detection"
      permission="vulnerability.read"
      action={
        <div className="flex items-center gap-2">
          {/* Investigation selector */}
          <Select value={selectedInvId} onValueChange={setSelectedInvId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select investigation" />
            </SelectTrigger>
            <SelectContent>
              {investigations?.map(inv => (
                <SelectItem key={inv.id} value={inv.id}>
                  {inv.query?.slice(0, 30) || inv.id.slice(0, 8)}
                  {inv.graphStatus === 'completed' && ' ✓'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Community filter */}
          <Select value={communityFilter} onValueChange={setCommunityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Community" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Communities</SelectItem>
              {communityList.map(c => (
                <SelectItem key={c} value={String(c)}>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: COMMUNITY_COLORS[c % COMMUNITY_COLORS.length] }}
                    />
                    Community #{c}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-1">
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="size-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="size-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleReset}>
              <Maximize2 className="size-4" />
            </Button>
          </div>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading VoidAccess graph...
        </div>
      ) : !graphData?.nodes?.length ? (
        <div className="rounded-lg border border-dashed bg-muted/30 p-12 text-center">
          <GitBranch className="mx-auto mb-3 size-10 text-muted-foreground/40" />
          <p className="text-lg font-medium">No graph data</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {!selectedInvId
              ? 'Select an investigation to view its entity relationship graph.'
              : 'This investigation does not have graph data yet. Run a VoidAccess investigation to generate the graph.'}
          </p>
        </div>
      ) : (
        <div className="flex gap-4">
          {/* Graph SVG */}
          <div className="flex-1 overflow-hidden rounded-lg border bg-card">
            {/* Search bar */}
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <Search className="size-4 text-muted-foreground" />
              <Input
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-7 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
              />
              <span className="text-xs text-muted-foreground">
                {filteredNodes.length}/{layoutNodes.length} nodes
              </span>
            </div>

            <svg
              ref={svgRef}
              width="100%"
              height="600"
              viewBox={`0 0 ${900 / zoom} ${600 / zoom}`}
              className="cursor-grab active:cursor-grabbing"
            >
              <defs>
                <marker id="arrowhead" viewBox="0 0 10 7" refX="10" refY="3.5"
                  markerWidth="6" markerHeight="4" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                </marker>
              </defs>

              {/* Edges */}
              {filteredEdges.map((edge, i) => {
                const s = nodeMap.get(edge.source);
                const t = nodeMap.get(edge.target);
                if (!s || !t) return null;
                return (
                  <g key={edge.id || i}>
                    <line x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                      stroke="#94a3b8" strokeWidth={Math.max(0.5, (edge.weight || 1) * 0.5)}
                      strokeOpacity={0.4} markerEnd="url(#arrowhead)" />
                    {zoom > 0.7 && (
                      <text x={(s.x + t.x) / 2} y={(s.y + t.y) / 2 - 4}
                        fontSize={7} fill="#94a3b8" textAnchor="middle">
                        {edge.label || edge.relation_type || ''}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Nodes */}
              {filteredNodes.map(node => {
                const isSelected = selectedNode?.id === node.id;
                const score = node.threat_score ?? node.priority_score ?? 0;
                return (
                  <g key={node.id} onClick={() => setSelectedNode(node)} className="cursor-pointer">
                    {/* Threat ring */}
                    {score >= 40 && (
                      <circle cx={node.x} cy={node.y} r={node.radius + 3}
                        fill="none" stroke={score >= 80 ? '#ef4444' : score >= 60 ? '#f97316' : '#eab308'}
                        strokeWidth={2} strokeOpacity={0.6} />
                    )}
                    {/* Selection ring */}
                    {isSelected && (
                      <circle cx={node.x} cy={node.y} r={node.radius + 6}
                        fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 2" />
                    )}
                    {/* Node */}
                    <circle cx={node.x} cy={node.y} r={node.radius}
                      fill={node.nodeColor} fillOpacity={0.85}
                      stroke="white" strokeWidth={1.5} />
                    {/* High signal indicator */}
                    {node.high_signal && (
                      <circle cx={node.x + node.radius - 2} cy={node.y - node.radius + 2}
                        r={3} fill="#ef4444" stroke="white" strokeWidth={1} />
                    )}
                    {/* Label */}
                    <text x={node.x} y={node.y + node.radius + 12}
                      fontSize={8} fill="currentColor" textAnchor="middle"
                      className="select-none">
                      {node.displayLabel}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Side Panel */}
          <div className="w-72 shrink-0 space-y-4">
            {/* Graph Stats (from VoidAccess) */}
            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                VoidAccess Graph
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nodes</span>
                  <span className="font-medium">{graphData.node_count || graphData.nodes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Edges</span>
                  <span className="font-medium">{graphData.edge_count || graphData.edges.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Communities</span>
                  <span className="font-medium">{communityList.length}</span>
                </div>
              </div>
            </div>

            {/* Communities */}
            {communityList.length > 0 && (
              <div className="rounded-lg border bg-card p-4">
                <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  Communities (Louvain)
                </h4>
                <div className="space-y-1.5">
                  {communityList.map(c => {
                    const count = layoutNodes.filter(n => n.community === c).length;
                    return (
                      <button key={c}
                        className="flex w-full items-center justify-between rounded px-2 py-1 text-xs hover:bg-muted/50"
                        onClick={() => setCommunityFilter(communityFilter === String(c) ? 'all' : String(c))}>
                        <div className="flex items-center gap-1.5">
                          <div className="size-2.5 rounded-full"
                            style={{ backgroundColor: COMMUNITY_COLORS[c % COMMUNITY_COLORS.length] }} />
                          <span>Community #{c}</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">{count}</Badge>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Node Type Legend */}
            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                Node Types
              </h4>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(TYPE_COLORS).slice(0, 14).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-[10px] text-muted-foreground">{type}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Node Detail */}
            {selectedNode && (
              <div className="rounded-lg border bg-card p-4">
                <h4 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                  Selected Entity
                </h4>
                <div className="space-y-2">
                  <p className="break-all font-mono text-xs font-medium">
                    {selectedNode.label || selectedNode.value || selectedNode.id}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="text-xs">
                      {selectedNode.type || selectedNode.entity_type || 'unknown'}
                    </Badge>
                    {selectedNode.community != null && (
                      <Badge variant="secondary" className="text-xs"
                        style={{ backgroundColor: COMMUNITY_COLORS[selectedNode.community % COMMUNITY_COLORS.length] + '30' }}>
                        C#{selectedNode.community}
                      </Badge>
                    )}
                    {selectedNode.high_signal && (
                      <Badge variant="destructive" className="text-[10px]">HIGH SIGNAL</Badge>
                    )}
                  </div>
                  {(selectedNode.threat_score != null || selectedNode.priority_score != null) && (
                    <p className={`text-xs font-bold ${
                      (selectedNode.threat_score ?? 0) >= 80 ? 'text-red-600'
                      : (selectedNode.threat_score ?? 0) >= 60 ? 'text-orange-600'
                      : 'text-muted-foreground'
                    }`}>
                      Threat: {selectedNode.threat_score ?? selectedNode.priority_score ?? 0}/100
                    </p>
                  )}
                  {selectedNode.confidence != null && (
                    <p className="text-xs text-muted-foreground">
                      Confidence: {Math.round((selectedNode.confidence ?? 0) * 100)}%
                    </p>
                  )}
                  {selectedNode.source_url && (
                    <p className="truncate text-xs text-muted-foreground">
                      Source: {selectedNode.source_url}
                    </p>
                  )}
                  {/* Connections count */}
                  <p className="text-xs text-muted-foreground">
                    Connections: {layoutEdges.filter(e =>
                      e.source === selectedNode.id || e.target === selectedNode.id
                    ).length}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Page>
  );
}
