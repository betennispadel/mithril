import { createFileRoute } from '@tanstack/react-router';
import CtiStartDiscoveryPage from '@/pages/cti/cti-start-discovery';

export const Route = createFileRoute('/_authed/cti/start-discovery')({
  component: () => <CtiStartDiscoveryPage />,
});
