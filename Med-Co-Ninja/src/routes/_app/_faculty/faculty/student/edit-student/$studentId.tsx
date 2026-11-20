import AddStudent from '@/components/faculty/student/AddStudent';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/_faculty/faculty/student/edit-student/$studentId')({
  component: RouteComponent,
});

function RouteComponent() {
  const { studentId } = Route.useParams();
  return <AddStudent studentId={studentId} />;
}
