import { createFileRoute } from '@tanstack/react-router';
import CtiMonitorsPage from '@/pages/cti/cti-monitors';

export const Route = createFileRoute('/_authed/cti/monitors/')({
  component: () => <CtiMonitorsPage />,
});
