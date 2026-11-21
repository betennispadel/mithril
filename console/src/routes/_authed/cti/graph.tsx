import { createFileRoute } from '@tanstack/react-router';
import CtiEntityGraphPage from '@/pages/cti/cti-entity-graph';

export const Route = createFileRoute('/_authed/cti/graph')({
  component: () => <CtiEntityGraphPage />,
});
