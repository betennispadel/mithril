import Page from '@/components/common/page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { GitBranch, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { axiosInstance } from '@/services/apis/axios-client';
import { useWorkspaceSelector } from '@/hooks/useWorkspaceSelector';
import CreateWorkspace from '@/pages/workspaces/create-workspace';
import { useCallback, useEffect, useRef, useState } from 'react';

interface GraphNode {
  id: string;
  value: string;
  type: string;
  threatScore: number;
  confidence: number;
  source: string | null;
  // simulation props
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationType: string;
  confidence: number;
}

const TYPE_COLORS: Record<string, string> = {
  DOMAIN: '#3b82f6',
  IP: '#f97316',
  EMAIL: '#a855f7',
  URL: '#14b8a6',
  FILE_HASH: '#6b7280',
  CRYPTO_WALLET: '#10b981',
  THREAT_ACTOR: '#ef4444',
  ORGANIZATION: '#6366f1',
  CVE: '#f59e0b',
  ASN: '#84cc16',
  ONION: '#8b5cf6',
  USERNAME: '#ec4899',
  KEYWORD: '#eab308',
  PHONE: '#f43f5e',
  TELEGRAM_CHANNEL: '#06b6d4',
  APP_PACKAGE: '#0ea5e9',
};

function threatRadius(score: number): number {
  if (score >= 80) return 14;
  if (score >= 60) return 12;
  if (score >= 40) return 10;
  return 8;
}

function threatStroke(score: number): string {
  if (score >= 80) return '#ef4444';
  if (score >= 60) return '#f97316';
  if (score >= 40) return '#eab308';
  return 'transparent';
}

/**
 * Simple force-directed layout simulation.
 * Runs entirely in the component — no external dependencies.
 */
function simulateForces(
  nodes: GraphNode[],
  edges: GraphEdge[],
  iterations: number = 100,
): void {
  const width = 900;
  const height = 600;

  // Initialize positions randomly
  for (const n of nodes) {
    n.x = width / 2 + (Math.random() - 0.5) * width * 0.6;
    n.y = height / 2 + (Math.random() - 0.5) * height * 0.6;
    n.vx = 0;
    n.vy = 0;
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations;
    const repulsion = 5000 * alpha;
    const attraction = 0.005 * alpha;
    const centerForce = 0.01 * alpha;

    // Repulsion between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = repulsion / (dist * dist);
        dx = (dx / dist) * force;
        dy = (dy / dist) * force;
        a.vx += dx;
        a.vy += dy;
        b.vx -= dx;
        b.vy -= dy;
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const s = nodeMap.get(edge.source);
      const t = nodeMap.get(edge.target);
      if (!s || !t) continue;
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const force = dist * attraction;
      s.vx += dx * force;
      s.vy += dy * force;
      t.vx -= dx * force;
      t.vy -= dy * force;
    }

    // Center gravity
    for (const n of nodes) {
      n.vx += (width / 2 - n.x) * centerForce;
      n.vy += (height / 2 - n.y) * centerForce;
    }

    // Apply velocity with damping
    for (const n of nodes) {
      n.vx *= 0.6;
      n.vy *= 0.6;
      n.x += n.vx;
      n.y += n.vy;
      // Clamp to bounds
      n.x = Math.max(30, Math.min(width - 30, n.x));
      n.y = Math.max(30, Math.min(height - 30, n.y));
    }
  }
}

export default function CtiEntityGraphPage() {
  const { workspaces } = useWorkspaceSelector();
  const hasWorkspace = workspaces.length > 0;
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['cti-graph'],
    queryFn: () =>
      axiosInstance
        .get<{ nodes: GraphNode[]; edges: GraphEdge[] }>('/api/cti-assets/graph')
        ,
    enabled: hasWorkspace,
  });

  // Run simulation when data changes
  const [layoutNodes, setLayoutNodes] = useState<GraphNode[]>([]);
  const [layoutEdges, setLayoutEdges] = useState<GraphEdge[]>([]);

  useEffect(() => {
    if (!data || data.nodes.length === 0) return;
    const nodes = data.nodes.map((n) => ({
      ...n,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
    }));
    simulateForces(nodes, data.edges, 150);
    setLayoutNodes(nodes);
    setLayoutEdges(data.edges);
  }, [data]);

  const nodeMap = new Map(layoutNodes.map((n) => [n.id, n]));

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z * 1.3, 4)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z / 1.3, 0.3)), []);
  const handleReset = useCallback(() => {
    setZoom(1);
    setSelectedNode(null);
  }, []);

  if (!hasWorkspace) {
    return (
      <Page title="Entity Graph" permission="vulnerability.read">
        <CreateWorkspace />
      </Page>
    );
  }

  return (
    <Page
      title="Entity Graph"
      description="Visual relationship map of CTI entities"
      permission="vulnerability.read"
      action={
        <div className="flex gap-2">
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
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading graph...
        </div>
      ) : layoutNodes.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 p-12 text-center">
          <GitBranch className="mx-auto mb-3 size-10 text-muted-foreground/40" />
          <p className="text-lg font-medium">No entity graph yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Entity relationships will appear here after CTI targets are scanned
            and assets are correlated.
          </p>
        </div>
      ) : (
        <div className="flex gap-4">
          {/* Graph SVG */}
          <div className="flex-1 overflow-hidden rounded-lg border bg-card">
            <svg
              ref={svgRef}
              width="100%"
              height="600"
              viewBox={`0 0 ${900 / zoom} ${600 / zoom}`}
              className="cursor-grab active:cursor-grabbing"
            >
              <defs>
                <marker
                  id="arrowhead"
                  viewBox="0 0 10 7"
                  refX="10"
                  refY="3.5"
                  markerWidth="6"
                  markerHeight="4"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="#94a3b8"
                  />
                </marker>
              </defs>

              {/* Edges */}
              {layoutEdges.map((edge) => {
                const s = nodeMap.get(edge.source);
                const t = nodeMap.get(edge.target);
                if (!s || !t) return null;
                return (
                  <g key={edge.id}>
                    <line
                      x1={s.x}
                      y1={s.y}
                      x2={t.x}
                      y2={t.y}
                      stroke="#94a3b8"
                      strokeWidth={1}
                      strokeOpacity={0.4}
                      markerEnd="url(#arrowhead)"
                    />
                    <text
                      x={(s.x + t.x) / 2}
                      y={(s.y + t.y) / 2 - 4}
                      fontSize={7}
                      fill="#94a3b8"
                      textAnchor="middle"
                    >
                      {edge.relationType}
                    </text>
                  </g>
                );
              })}

              {/* Nodes */}
              {layoutNodes.map((node) => {
                const r = threatRadius(node.threatScore);
                const color = TYPE_COLORS[node.type] ?? '#6b7280';
                const stroke = threatStroke(node.threatScore);
                const isSelected = selectedNode?.id === node.id;

                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className="cursor-pointer"
                  >
                    {/* Threat ring */}
                    {node.threatScore >= 40 && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={r + 3}
                        fill="none"
                        stroke={stroke}
                        strokeWidth={2}
                        strokeOpacity={0.6}
                      />
                    )}
                    {/* Selection ring */}
                    {isSelected && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={r + 6}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        strokeDasharray="4 2"
                      />
                    )}
                    {/* Node circle */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={r}
                      fill={color}
                      fillOpacity={0.85}
                      stroke="white"
                      strokeWidth={1.5}
                    />
                    {/* Label */}
                    <text
                      x={node.x}
                      y={node.y + r + 12}
                      fontSize={8}
                      fill="currentColor"
                      textAnchor="middle"
                      className="select-none"
                    >
                      {node.value.length > 25
                        ? node.value.slice(0, 22) + '...'
                        : node.value}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Detail Panel */}
          <div className="w-72 shrink-0 space-y-4">
            {/* Legend */}
            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                Node Types
              </h4>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(TYPE_COLORS)
                  .slice(0, 12)
                  .map(([type, color]) => (
                    <div key={type} className="flex items-center gap-1.5">
                      <div
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {type}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Stats */}
            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                Graph Stats
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nodes</span>
                  <span className="font-medium">{layoutNodes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Edges</span>
                  <span className="font-medium">{layoutEdges.length}</span>
                </div>
              </div>
            </div>

            {/* Selected Node */}
            {selectedNode && (
              <div className="rounded-lg border bg-card p-4">
                <h4 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                  Selected Entity
                </h4>
                <div className="space-y-2">
                  <p className="break-all font-mono text-xs font-medium">
                    {selectedNode.value}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {selectedNode.type}
                    </Badge>
                    <span
                      className={`text-xs font-bold ${
                        selectedNode.threatScore >= 80
                          ? 'text-red-600'
                          : selectedNode.threatScore >= 60
                            ? 'text-orange-600'
                            : selectedNode.threatScore >= 40
                              ? 'text-yellow-600'
                              : 'text-muted-foreground'
                      }`}
                    >
                      {selectedNode.threatScore}/100
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>
                      Confidence: {Math.round(selectedNode.confidence * 100)}%
                    </p>
                    {selectedNode.source && (
                      <p>Source: {selectedNode.source}</p>
                    )}
                  </div>
                  <Link
                    to="/cti/assets/$assetId"
                    params={{ assetId: selectedNode.id }}
                  >
                    <Button variant="outline" size="sm" className="mt-2 w-full">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Page>
  );
}
