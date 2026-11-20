import ExamForm from '@/components/faculty/exam/ExamFrom'
import { createFileRoute, useParams } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/_admin/admin/examform/examform')({
  component: RouteComponent,
})

function RouteComponent() {
  // const {id}  = Route.useParams();
  return (
    <div>
      <ExamForm  />
    </div>
  )
}
