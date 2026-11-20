import { ExamReviewTable } from '@/components/faculty/exam/ExamReviewTable'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_app/_faculty/faculty/examform/exam-review/$id',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <ExamReviewTable/>
}
