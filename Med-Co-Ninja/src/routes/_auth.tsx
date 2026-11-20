import { AuthLayout } from '@/layouts';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth')({
  beforeLoad: ({ context }) => {
    const { isAuthenticated, user } = context.auth;
    // Redirect already-authenticated users away from the sign-in page
    if (isAuthenticated) {
      if (user?.role === 'SUPERADMIN') {
        throw redirect({ to: '/superadmin/admins' });
      }
      if (user?.role === 'TEACHER') {
        throw redirect({ to: '/faculty/batchtable' });
      }
      if (user?.role === 'STUDENT') {
        throw redirect({ to: '/student/studentdahboard' });
      }
    }
  },
  component: AuthLayout,
});
