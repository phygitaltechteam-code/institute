import DisplayDailyTask from '@/components/faculty/batch/DisplayDailyTask';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/_faculty/faculty/dailytask/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();

  return (
    <div>
      <DisplayDailyTask batchId={id} />
    </div>
  );
}