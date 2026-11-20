import ExamTable from '@/components/faculty/exam/ExamTable'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/_faculty/faculty/exam-table')({
  component: RouteComponent,
})

function RouteComponent() {
  return <ExamTable batchId="undefined" />
}
