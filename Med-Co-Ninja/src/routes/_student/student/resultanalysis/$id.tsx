import ExamResultAnalysis from '@/components/student/placement/exam/ExamResultAnalysis'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_student/student/resultanalysis/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <ExamResultAnalysis />
}
