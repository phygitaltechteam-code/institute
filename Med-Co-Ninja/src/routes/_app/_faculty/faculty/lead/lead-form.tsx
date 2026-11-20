import LeadForm from '@/components/faculty/lead/LeadForm'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/_faculty/faculty/lead/lead-form')({
  component: RouteComponent,
})

function RouteComponent() {
  return <LeadForm/>
}
