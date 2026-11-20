
import ReferalIncome from '@/components/faculty/Referal/ReferalIncome'
import { createFileRoute, useLocation } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_app/_admin/admin/referal/refaral-income/$id',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const location = useLocation()
  const batchId = (location.state as any)?.batchId || ''
  const studentId = (location.state as any)?.studentId || ''
  const studentName = (location.state as any)?.studentName || ''
  const leads = (location.state as any)?.leads || []

  return (
    <ReferalIncome
      leadId={id}
      batchId={batchId}
      studentId={studentId}
      studentName={studentName}
      leads={leads}
    />
  )
}