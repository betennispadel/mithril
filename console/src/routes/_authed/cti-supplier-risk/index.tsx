import { createFileRoute, stripSearchParams } from '@tanstack/react-router';
import { z } from 'zod';
import { tableSearch } from '@/lib/table-search';
import SupplierRiskPage from '@/pages/cti/supplier-risk';

const DEFAULT_WHERE = '{"logic":"and","items":[{"field":"tool","op":"eq","value":"supplier-risk"}]}';

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

export const Route = createFileRoute('/_authed/cti-supplier-risk/')({
  validateSearch: searchSchema,
  search: { middlewares: [stripSearchParams({ ...table.defaults, where: DEFAULT_WHERE })] },
  component: () => <SupplierRiskPage />,
});
