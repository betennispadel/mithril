import { createFileRoute } from '@tanstack/react-router';
import CtiTargetsPage from '@/pages/cti/cti-targets';

export const Route = createFileRoute('/_authed/cti/')({
  component: () => <CtiTargetsPage />,
});
