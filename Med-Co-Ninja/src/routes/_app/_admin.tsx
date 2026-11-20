import { createFileRoute, redirect } from '@tanstack/react-router'
import AdminLayout from '@/layouts/AdminLayout'

export const Route = createFileRoute('/_app/_admin')({
  beforeLoad: ({ context }) => {
    const { isAuthenticated, user, isLoading } = context.auth;
    // Wait for auth state to be restored from localStorage before redirecting
    if (isLoading) return;
    if (!isAuthenticated) {
      throw redirect({ to: '/signin' });
    }
    // Block TEACHER and STUDENT from accessing any admin route
    if (user?.role !== 'ADMIN') {
      if (user?.role === 'SUPERADMIN') {
        throw redirect({ to: '/superadmin/admins' });
      }
      if (user?.role === 'TEACHER') {
        throw redirect({ to: '/faculty/batchtable' });
      }
      if (user?.role === 'STUDENT') {
        throw redirect({ to: '/student/studentdahboard' });
      }
      throw redirect({ to: '/signin' });
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  return <AdminLayout/>
}
