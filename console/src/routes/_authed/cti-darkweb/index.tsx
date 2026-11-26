import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_authed/cti-darkweb/')({
  beforeLoad: () => {
    throw redirect({ to: '/cti/findings', search: { category: 'darkweb' } });
  },
  component: () => null,
});
