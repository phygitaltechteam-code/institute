import FacultyLeadInfo from '@/components/faculty/lead/FacultyLeadInfo'
import LeadInfo from '@/components/faculty/lead/LeadInfo'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/_faculty/faculty/lead/lead/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <FacultyLeadInfo leadId={id} />
}
