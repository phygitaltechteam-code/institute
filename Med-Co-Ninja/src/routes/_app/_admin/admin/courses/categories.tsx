import { createFileRoute } from '@tanstack/react-router';
import CourseCategories from '@/components/academy/courses/CourseCategories';

export const Route = createFileRoute('/_app/_admin/admin/courses/categories')({
  component: CourseCategories,
});
