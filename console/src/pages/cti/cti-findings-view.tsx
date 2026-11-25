import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { axiosInstance } from '@/services/apis/axios-client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight, AlertTriangle, Shield, Info, AlertCircle, AlertOctagon } from 'lucide-react';

interface CtiFinding {
  id: string;
  name: string;
  severity: string;
  description: string;
  category: string;
  tags: string[];
  matchedAt: string;
  source: string;
  firstSeenAt: string;
  lastSeenAt: string;
  timesDetected: number;
  metadata: Record<string, any>;
}

interface CtiFindingsResponse {
  items: CtiFinding[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  severitySummary: { severity: string; count: string }[];
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  low: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  info: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

const severityIcons: Record<string, any> = {
  critical: AlertOctagon,
  high: AlertTriangle,
  medium: AlertCircle,
  low: Shield,
  info: Info,
};

export function CtiFindingsView({ category }: { category?: string }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState<string>('');
  const pageSize = 20;
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['cti-findings', category, page, search, severity],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (category) params.set('category', category);
      if (severity) params.set('severity', severity);
      if (search) params.set('search', search);
      const res = await axiosInstance.get<CtiFindingsResponse>(
        `/api/cti-findings?${params.toString()}`,
      );
      return res as unknown as CtiFindingsResponse;
    },
  });

  const findings = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const summary = data?.severitySummary ?? [];

  const handleRowClick = (findingId: string) => {
    navigate({ to: '/cti/findings/$findingId', params: { findingId } });
  };

  return (
    <div className="space-y-4">
      {/* Severity Summary Cards */}
      <div className="grid grid-cols-5 gap-3">
        {['critical', 'high', 'medium', 'low', 'info'].map((sev) => {
          const count = summary.find((s) => s.severity === sev)?.count ?? '0';
          const Icon = severityIcons[sev];
          return (
            <button
              key={sev}
              onClick={() => setSeverity(severity === sev ? '' : sev)}
              className={`flex items-center gap-2 rounded-lg border p-3 transition-all ${
                severity === sev
                  ? severityColors[sev] + ' ring-1 ring-current'
                  : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              <div className="text-left">
                <div className="text-xs capitalize">{sev}</div>
                <div className="text-lg font-semibold">{count}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search + Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search findings..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800">
              <TableHead className="w-[100px]">Severity</TableHead>
              <TableHead>Finding</TableHead>
              <TableHead className="w-[120px]">Category</TableHead>
              <TableHead className="w-[150px]">Source</TableHead>
              <TableHead className="w-[150px]">Matched At</TableHead>
              <TableHead className="w-[100px] text-right">Seen</TableHead>
              <TableHead className="w-[150px]">First Seen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-zinc-500">
                  Loading...
                </TableCell>
              </TableRow>
            ) : findings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-zinc-500">
                  No findings yet. Start a discovery scan to populate this view.
                </TableCell>
              </TableRow>
            ) : (
              findings.map((f) => (
                <TableRow
                  key={f.id}
                  className="border-zinc-800 hover:bg-zinc-900/50 cursor-pointer"
                  onClick={() => handleRowClick(f.id)}
                >
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={severityColors[f.severity] ?? severityColors.info}
                    >
                      {f.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-zinc-200">{f.name}</div>
                    {f.description && (
                      <div className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                        {f.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                      {f.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400 text-sm">{f.source}</TableCell>
                  <TableCell className="text-zinc-400 text-sm font-mono text-xs">
                    {f.matchedAt?.substring(0, 40)}
                  </TableCell>
                  <TableCell className="text-right text-zinc-400">
                    {f.timesDetected > 1 ? `${f.timesDetected}x` : ''}
                  </TableCell>
                  <TableCell className="text-zinc-500 text-sm">
                    {new Date(f.firstSeenAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-zinc-500">
          <span>
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
