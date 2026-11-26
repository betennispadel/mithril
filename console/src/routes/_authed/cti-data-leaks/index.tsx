import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_authed/cti-data-leaks/')({
  beforeLoad: () => {
    throw redirect({ to: '/cti/findings', search: { category: 'data-leak' } });
  },
  component: () => null,
});
