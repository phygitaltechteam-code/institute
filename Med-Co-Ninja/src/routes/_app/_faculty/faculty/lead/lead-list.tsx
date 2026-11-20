import LeadTable from '@/components/faculty/lead/LeadTable'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/_faculty/faculty/lead/lead-list')({
  component: RouteComponent,
})

function RouteComponent() {
  return <LeadTable />
}
