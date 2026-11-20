import { createFileRoute, redirect } from '@tanstack/react-router';
import AdminLayout from '@/layouts/AdminLayout';

export const Route = createFileRoute('/_app/_superadmin')({
  beforeLoad: ({ context }) => {
    const { isAuthenticated, user, isLoading } = context.auth;
    // Wait for auth state to be restored from localStorage before redirecting
    if (isLoading) return;
    if (!isAuthenticated) {
      throw redirect({ to: '/signin' });
    }
    if (user?.role !== 'SUPERADMIN') {
      if (user?.role === 'ADMIN') throw redirect({ to: '/admin/dashboard' });
      if (user?.role === 'TEACHER') throw redirect({ to: '/faculty/batchtable' });
      if (user?.role === 'STUDENT') throw redirect({ to: '/student/studentdahboard' });
      throw redirect({ to: '/signin' });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  // AdminLayout renders the shared Sidebar, which shows the SUPERADMIN menu for this role
  return <AdminLayout />;
}
