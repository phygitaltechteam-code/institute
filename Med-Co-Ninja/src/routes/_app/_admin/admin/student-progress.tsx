import StudentProgress from '@/components/faculty/StudentProgress'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/_admin/admin/student-progress')({
  component: StudentProgress,
})


