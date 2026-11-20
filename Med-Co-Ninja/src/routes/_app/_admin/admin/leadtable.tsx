import { createFileRoute } from '@tanstack/react-router'
import LeadTable from '@/components/faculty/lead/LeadTable'

export const Route = createFileRoute('/_app/_admin/admin/leadtable')({
  component: RouteComponent,
})

function RouteComponent() {
    const {id} = Route.useParams();
  return <LeadTable batchId={id} />;
}
