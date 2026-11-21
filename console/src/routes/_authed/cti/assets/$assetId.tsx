import { createFileRoute } from '@tanstack/react-router';
import CtiAssetDetailPage from '@/pages/cti/cti-asset-detail';

export const Route = createFileRoute('/_authed/cti/assets/$assetId')({
  component: () => <CtiAssetDetailPage />,
});
