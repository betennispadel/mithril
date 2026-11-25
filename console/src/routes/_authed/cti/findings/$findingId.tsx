import { createFileRoute } from '@tanstack/react-router';
import CtiFindingDetailPage from '@/pages/cti/cti-finding-detail';

export const Route = createFileRoute('/_authed/cti/findings/$findingId')({
  component: () => <CtiFindingDetailPage />,
});
