import { createFileRoute, stripSearchParams } from '@tanstack/react-router';
import { z } from 'zod';
import { tableSearch } from '@/lib/table-search';
import DataLeaksPage from '@/pages/cti/data-leaks';

const table = tableSearch({ sortBy: 'severity', sortOrder: 'DESC' });

const searchSchema = z.object({
  ...table.shape,
  severity: z.string().optional(),
  tags: z.string().optional(),
  createdFrom: z.string().optional(),
  createdTo: z.string().optional(),
  targetId: z.string().optional(),
  where: z.string().optional(),
});

export const Route = createFileRoute('/_authed/cti-data-leaks/')({
  validateSearch: searchSchema,
  search: { middlewares: [stripSearchParams(table.defaults)] },
  component: () => <DataLeaksPage />,
});
