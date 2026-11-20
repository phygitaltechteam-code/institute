import FacultyLayout from '@/layouts/FacultyLayout';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/_faculty')({
  beforeLoad: ({ context }) => {
    const { isAuthenticated, user, isLoading } = context.auth;
    // Wait for auth state to be restored from localStorage before redirecting
    if (isLoading) return;
    if (!isAuthenticated) {
      throw redirect({ to: '/signin' });
    }
    if (user?.role !== 'TEACHER') {
      throw redirect({ to: '/signin' });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <FacultyLayout />;
}