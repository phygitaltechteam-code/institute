import { createFileRoute } from '@tanstack/react-router';
import ManageCourses from '@/components/academy/courses/ManageCourses';

export const Route = createFileRoute('/_app/_admin/admin/courses/manage')({
  component: ManageCourses,
});
