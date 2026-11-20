import { createFileRoute } from '@tanstack/react-router';
import ResetPassword from '@/components/academy/settings/ResetPassword';

export const Route = createFileRoute('/_app/_admin/admin/settings/reset-password')({
  component: ResetPassword,
});
