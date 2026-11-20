import StudentLayout from '@/layouts/StudentLayout';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_student')({
  beforeLoad: ({ context }) => {
    const { isAuthenticated, user } = context.auth;
    if (!isAuthenticated) {
      throw redirect({ to: '/signin' });
    }
    if (user?.role !== 'STUDENT') {
      throw redirect({ to: '/signin' });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <StudentLayout />;
}
