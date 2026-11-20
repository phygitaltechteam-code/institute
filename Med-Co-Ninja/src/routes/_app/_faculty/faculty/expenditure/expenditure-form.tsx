import { ExpenditureForm } from '@/components/faculty/expenditure/ExpenditureForm'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_app/_faculty/faculty/expenditure/expenditure-form',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div className='p-2'><ExpenditureForm/></div>
}
