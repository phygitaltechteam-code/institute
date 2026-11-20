import { createFileRoute } from '@tanstack/react-router'
import UpdateTask from '@/components/faculty/batch/UpdateTask'

export const Route = createFileRoute('/_app/_admin/admin/updatedailytask/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const {id} = Route.useParams();
  return <UpdateTask batchId={id} />
}
