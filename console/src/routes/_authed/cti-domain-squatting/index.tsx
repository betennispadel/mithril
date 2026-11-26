import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_authed/cti-domain-squatting/')({
  beforeLoad: () => {
    throw redirect({ to: '/cti/findings', search: { category: 'brand-protection' } });
  },
  component: () => null,
});
