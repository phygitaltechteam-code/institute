import { createFileRoute } from '@tanstack/react-router';
import CourseEnrollment from '@/components/academy/enrollment/CourseEnrollment';

export const Route = createFileRoute('/_app/_admin/admin/enrollment/course')({
  component: CourseEnrollment,
});
