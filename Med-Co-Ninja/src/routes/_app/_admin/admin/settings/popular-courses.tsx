import { createFileRoute } from '@tanstack/react-router';
import PopularCourses from '@/components/academy/settings/PopularCourses';

export const Route = createFileRoute('/_app/_admin/admin/settings/popular-courses')({
  component: PopularCourses,
});
