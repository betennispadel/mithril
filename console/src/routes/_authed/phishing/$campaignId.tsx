import { createFileRoute } from '@tanstack/react-router';
import CampaignDetail from '@/pages/phishing/campaign-detail';

export const Route = createFileRoute('/_authed/phishing/$campaignId')({
  component: () => <CampaignDetail />,
});
