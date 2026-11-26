import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_authed/cti-sanctions/')({
  beforeLoad: () => {
    throw redirect({ to: '/cti/findings', search: { category: 'sanctions' } });
  },
  component: () => null,
});
