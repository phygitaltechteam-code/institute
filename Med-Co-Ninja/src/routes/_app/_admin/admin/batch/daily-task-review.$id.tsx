import { ReviewDayliTask } from '@/components/faculty/batch/ReviewDayliTask'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_app/_admin/admin/batch/daily-task-review/$id',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <ReviewDayliTask/>
}
