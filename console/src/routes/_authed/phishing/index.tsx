import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import PhishingCampaigns from '@/pages/phishing/phishing-campaigns';

const phishingSearchSchema = z.object({
  status: z.enum(['draft', 'running', 'completed', 'failed']).optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional(),
});

export const Route = createFileRoute('/_authed/phishing/')({
  validateSearch: phishingSearchSchema,
  component: () => <PhishingCampaigns />,
});
