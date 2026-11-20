import { createFileRoute } from '@tanstack/react-router';
import ManageStudents from '@/components/academy/users/ManageStudents';

export const Route = createFileRoute('/_app/_admin/admin/users/students')({
  component: ManageStudents,
});
