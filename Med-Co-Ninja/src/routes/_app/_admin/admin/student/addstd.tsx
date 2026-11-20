import AddStudent from '@/components/faculty/student/AddStudent'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/_admin/admin/student/addstd')({
  component: RouteComponent,
})

function RouteComponent() {
  return <AddStudent />
}
