import { createFileRoute, stripSearchParams } from '@tanstack/react-router';
import { z } from 'zod';
import { tableSearch } from '@/lib/table-search';
import SocialMonitorPage from '@/pages/cti/social-monitor';

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

export const Route = createFileRoute('/_authed/cti-social-monitor/')({
  validateSearch: searchSchema,
  search: { middlewares: [stripSearchParams(table.defaults)] },
  component: () => <SocialMonitorPage />,
});
