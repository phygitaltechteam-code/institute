import { createFileRoute } from '@tanstack/react-router';
import CourseCurriculum from '@/components/academy/courses/CourseCurriculum';

export const Route = createFileRoute('/_app/_admin/admin/courses/$courseId/curriculum')({
  component: CurriculumRoute,
});

function CurriculumRoute() {
  const { courseId } = Route.useParams();
  return <CourseCurriculum courseId={courseId} />;
}
