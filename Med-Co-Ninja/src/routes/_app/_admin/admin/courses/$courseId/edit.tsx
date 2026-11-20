import { createFileRoute } from '@tanstack/react-router';
import CourseForm from '@/components/academy/courses/CourseForm';

export const Route = createFileRoute('/_app/_admin/admin/courses/$courseId/edit')({
  component: EditCourseRoute,
});

function EditCourseRoute() {
  const { courseId } = Route.useParams();
  return <CourseForm key={courseId} courseId={courseId} />;
}
