import QuestionDisplay from '@/components/student/placement/exam/QuestionDisplay'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/studentside/questiondisplay')({
  component: RouteComponent,
})

function RouteComponent() {
  return <QuestionDisplay />
}
