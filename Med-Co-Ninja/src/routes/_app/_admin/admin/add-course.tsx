import AddCourse from '@/components/faculty/AddCourse'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/_admin/admin/add-course')({
  component: RouteComponent,
})

function RouteComponent() {
  return <AddCourse/>
}
