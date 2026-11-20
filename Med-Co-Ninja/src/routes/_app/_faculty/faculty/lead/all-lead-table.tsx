import { createFileRoute } from '@tanstack/react-router'
import AllLeadTable from '@/components/faculty/lead/AllLeadTable'

export const Route = createFileRoute('/_app/_faculty/faculty/lead/all-lead-table')({
  component: RouteComponent,
})

function RouteComponent() {
  return <AllLeadTable />
}
