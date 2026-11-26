import { createFileRoute } from '@tanstack/react-router';
import CtiFindingsPage from '@/pages/cti/cti-findings';

export const Route = createFileRoute('/_authed/cti/findings/')({
  component: () => <CtiFindingsPage />,
});
