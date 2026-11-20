import BatchCreation from '@/components/faculty/batch/BatchCreation'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_app/_admin/admin/batch/edit-batch/$batchId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { batchId } = Route.useParams()
  console.log('Batch ID from route params:', batchId)
  return <BatchCreation batchId={batchId} />
}
