import LeadFollowUpByid from '@/components/faculty/lead/LeadFollowUpByid'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_app/_admin/admin/lead/folloupUpdate/$id',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <LeadFollowUpByid leadId={id} />
}