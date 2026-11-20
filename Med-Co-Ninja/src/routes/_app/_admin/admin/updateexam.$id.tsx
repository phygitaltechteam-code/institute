import UpdateExamForm from '@/components/faculty/exam/UpdateExamForm';
import { createFileRoute, useLocation } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/_admin/admin/updateexam/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const location = useLocation();
  const batchId = (location.state as any)?.batchId;

  console.log('Exam ID:', id);
  console.log('Batch ID:', batchId);

  return (
    <div className="p-1">
      <UpdateExamForm batchId={batchId} />
    </div>
  );
}