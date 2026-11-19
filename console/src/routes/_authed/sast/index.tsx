import { createFileRoute, stripSearchParams } from '@tanstack/react-router';
import { z } from 'zod';
import { tableSearch } from '@/lib/table-search';
import SemgrepPage from '@/pages/sast/semgrep';

const table = tableSearch({ sortBy: 'severity', sortOrder: 'DESC' });

// Default filter: tool = Architect (Semgrep's display name in the DB)
const DEFAULT_WHERE = JSON.stringify({
  logic: 'and',
  items: [{ field: 'tool', op: 'eq', value: 'Architect' }],
});

const searchSchema = z.object({
  ...table.shape,
  severity: z.string().optional(),
  tags: z.string().optional(),
  createdFrom: z.string().optional(),
  createdTo: z.string().optional(),
  targetId: z.string().optional(),
  where: z.string().default(DEFAULT_WHERE),
});

export const Route = createFileRoute('/_authed/sast/')({
  validateSearch: searchSchema,
  search: {
    middlewares: [
      stripSearchParams({ ...table.defaults, where: DEFAULT_WHERE }),
    ],
  },
  component: () => <SemgrepPage />,
});
