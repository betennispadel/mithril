import { createFileRoute, stripSearchParams } from '@tanstack/react-router';
import { z } from 'zod';
import { tableSearch } from '@/lib/table-search';
import CtiSanctionsPage from '@/pages/cti/cti-sanctions';

const DEFAULT_WHERE = '{"logic":"and","items":[{"field":"tool","op":"eq","value":"pensieve"},{"field":"tags","op":"contains","value":"sanctions"}]}';

const table = tableSearch({ sortBy: 'severity', sortOrder: 'DESC' });

const searchSchema = z.object({
  ...table.shape,
  severity: z.string().optional(),
  tags: z.string().optional(),
  createdFrom: z.string().optional(),
  createdTo: z.string().optional(),
  targetId: z.string().optional(),
  where: z.string().default(DEFAULT_WHERE),
});

export const Route = createFileRoute('/_authed/cti-sanctions/')({
  validateSearch: searchSchema,
  search: { middlewares: [stripSearchParams({ ...table.defaults, where: DEFAULT_WHERE })] },
  component: () => <CtiSanctionsPage />,
});
