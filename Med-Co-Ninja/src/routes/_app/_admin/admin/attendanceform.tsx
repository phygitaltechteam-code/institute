import AttendenceForm from '@/components/faculty/Attendance/AttendenceForm'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/_admin/admin/attendanceform')({
  component: RouteComponent,
})

function RouteComponent() {
  return <AttendenceForm />
}
