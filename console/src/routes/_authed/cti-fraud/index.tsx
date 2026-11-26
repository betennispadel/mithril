import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_authed/cti-fraud/')({
  beforeLoad: () => {
    throw redirect({ to: '/cti/findings', search: { category: 'fraud' } });
  },
  component: () => null,
});
