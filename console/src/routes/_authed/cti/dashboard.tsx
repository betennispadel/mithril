import { createFileRoute } from '@tanstack/react-router';
import CtiDashboardPage from '@/pages/cti/cti-dashboard';

export const Route = createFileRoute('/_authed/cti/dashboard')({
  component: () => <CtiDashboardPage />,
});
