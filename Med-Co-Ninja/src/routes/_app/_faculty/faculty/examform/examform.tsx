import ExamForm from '@/components/faculty/exam/ExamFrom'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/_faculty/faculty/examform/examform')({
  component: RouteComponent,
})

function RouteComponent() {
  return <ExamForm />
  

}
