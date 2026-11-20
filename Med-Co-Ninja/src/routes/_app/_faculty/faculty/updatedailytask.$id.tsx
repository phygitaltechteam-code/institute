import UpdateTask from '@/components/faculty/batch/UpdateTask';
import { updateDailyTask } from '@/lib/api/admin/dailytask'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_app/_faculty/faculty/updatedailytask/$id',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const {id} = Route.useParams();
  return <UpdateTask batchId={id} />
}
