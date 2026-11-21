import { createFileRoute } from '@tanstack/react-router';
import CreateCampaign from '@/pages/phishing/create-campaign';

export const Route = createFileRoute('/_authed/phishing/new')({
  component: () => <CreateCampaign />,
});
