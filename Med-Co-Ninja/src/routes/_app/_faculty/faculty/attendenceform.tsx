import AttendenceForm from '@/components/faculty/Attendance/AttendenceForm'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/_faculty/faculty/attendenceform')({
  component: RouteComponent,
})

function RouteComponent() {
  return <AttendenceForm />
}
