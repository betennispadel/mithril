import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_authed/cti-brand-protection/')({
  beforeLoad: () => {
    throw redirect({ to: '/cti/findings', search: { category: 'brand' } });
  },
  component: () => null,
});
