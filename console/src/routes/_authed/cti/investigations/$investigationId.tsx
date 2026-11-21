import { createFileRoute } from '@tanstack/react-router';
import CtiInvestigationDetailPage from '@/pages/cti/cti-investigation-detail';

export const Route = createFileRoute(
  '/_authed/cti/investigations/$investigationId',
)({
  component: () => <CtiInvestigationDetailPage />,
});
