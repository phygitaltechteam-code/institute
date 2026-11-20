import ExamResult from '@/components/student/placement/exam/ExamResult'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_student/student/examresult/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <ExamResult />
}
