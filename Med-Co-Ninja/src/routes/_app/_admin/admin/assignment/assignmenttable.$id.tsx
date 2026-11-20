import Assignment from '@/components/student/assignment/Assignment'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_app/_admin/admin/assignment/assignmenttable/$id',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <Assignment batchId={id} />
}
