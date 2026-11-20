import LeadTable from '@/components/faculty/lead/LeadTable'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/_admin/admin/lead/lead-list')({
  component: RouteComponent,
})

function RouteComponent() {
  return <LeadTable/>
}
