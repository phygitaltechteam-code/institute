import UpdateLeadForm from '@/components/faculty/lead/UpdateLeadForm'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/_admin/admin/lead/updatelead/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <UpdateLeadForm />
}
