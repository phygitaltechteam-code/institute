import StudentExamResultTable from '@/components/faculty/exam/StudentExamResultTable'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_app/_admin/admin/student-exam-result-table',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <StudentExamResultTable/>
}
