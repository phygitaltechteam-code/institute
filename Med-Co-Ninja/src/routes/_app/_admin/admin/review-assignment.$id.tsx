import { ReviewAssignments } from '@/components/faculty/batch/ReviewAssignments'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_app/_admin/admin/review-assignment/$id',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <ReviewAssignments/>
}
