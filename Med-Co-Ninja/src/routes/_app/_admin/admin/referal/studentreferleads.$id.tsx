import StudentReferleadInfo from '@/components/faculty/Referal/StudentReferleadInfo'
import { createFileRoute, useLocation } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_app/_admin/admin/referal/studentreferleads/$id',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const location = useLocation()
  const batchId = (location.state as any)?.batchId || ''

  return <StudentReferleadInfo leadId={id} batchId={batchId} />
}