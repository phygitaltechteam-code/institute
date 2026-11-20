import { createFileRoute } from '@tanstack/react-router';
import CourseForm from '@/components/academy/courses/CourseForm';

export const Route = createFileRoute('/_app/_admin/admin/courses/new')({
  component: () => <CourseForm />,
});
