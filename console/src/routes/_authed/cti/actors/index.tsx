import { createFileRoute } from '@tanstack/react-router';
import CtiActorsPage from '@/pages/cti/cti-actors';

export const Route = createFileRoute('/_authed/cti/actors/')({
  component: () => <CtiActorsPage />,
});
