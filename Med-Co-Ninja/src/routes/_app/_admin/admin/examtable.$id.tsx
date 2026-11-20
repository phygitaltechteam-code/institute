import ExamTable from '@/components/faculty/exam/ExamTable';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/_admin/admin/examtable/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  const {id} = Route.useParams();
  return (
    <div >
      <ExamTable batchId={id} />
    </div>
  );
}
