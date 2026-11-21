import { createFileRoute } from '@tanstack/react-router';
import CtiTargetDetailPage from '@/pages/cti/cti-target-detail';

export const Route = createFileRoute('/_authed/cti/$targetId')({
  component: () => <CtiTargetDetailPage />,
});
