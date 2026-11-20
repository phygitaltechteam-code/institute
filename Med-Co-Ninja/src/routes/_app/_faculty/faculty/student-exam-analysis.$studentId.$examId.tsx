import ExamResultAnalysis from '@/components/faculty/exam/ExamResultAnalysis'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_app/_faculty/faculty/student-exam-analysis/$studentId/$examId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <ExamResultAnalysis />
}

