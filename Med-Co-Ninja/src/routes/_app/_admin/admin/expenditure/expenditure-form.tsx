import { ExpenditureForm } from '@/components/faculty/expenditure/ExpenditureForm'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_app/_admin/admin/expenditure/expenditure-form',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><ExpenditureForm /></div>
}
