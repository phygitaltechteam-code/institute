import { createFileRoute } from '@tanstack/react-router';
import AdminDashboard from '@/components/admin/dashboard/AdminDashboard';

export const Route = createFileRoute('/_app/_admin/admin/dashboard')({
  component: AdminDashboard,
});
