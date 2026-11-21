import { createFileRoute } from '@tanstack/react-router';
import CtiAssetsPage from '@/pages/cti/cti-assets';

export const Route = createFileRoute('/_authed/cti/assets/')({
  component: () => <CtiAssetsPage />,
});
