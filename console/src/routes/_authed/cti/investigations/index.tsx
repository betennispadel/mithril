import { createFileRoute } from '@tanstack/react-router';
import CtiInvestigationsPage from '@/pages/cti/cti-investigations';

export const Route = createFileRoute('/_authed/cti/investigations/')({
  component: () => <CtiInvestigationsPage />,
});
