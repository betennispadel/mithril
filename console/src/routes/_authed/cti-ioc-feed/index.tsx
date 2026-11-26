import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_authed/cti-ioc-feed/')({
  beforeLoad: () => {
    throw redirect({ to: '/cti/findings', search: { category: 'ioc' } });
  },
  component: () => null,
});
