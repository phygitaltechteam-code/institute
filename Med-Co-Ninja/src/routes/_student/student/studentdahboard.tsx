import StudentDashboard from '@/pages/StudentDashboard'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_student/student/studentdahboard')({
  component: RouteComponent,
})

function RouteComponent() {
  return <StudentDashboard />
}
