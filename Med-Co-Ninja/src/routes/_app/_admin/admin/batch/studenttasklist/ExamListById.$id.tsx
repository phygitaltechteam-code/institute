import { ExamStudentList } from '@/components/faculty/exam/ExamStudentList'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_app/_admin/admin/batch/studenttasklist/ExamListById/$id',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <ExamStudentList/>
  )
}
