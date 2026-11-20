import AddCourse from '@/components/faculty/AddCourse'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/_faculty/faculty/add-course')({
  component: RouteComponent,
})

function RouteComponent() {
  return <AddCourse/>
}
