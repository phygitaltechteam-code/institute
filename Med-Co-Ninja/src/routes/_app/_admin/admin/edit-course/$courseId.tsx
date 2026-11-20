import { createFileRoute } from '@tanstack/react-router'
import EditCourse from '@/components/faculty/EditCourse'

export const Route = createFileRoute(
  '/_app/_admin/admin/edit-course/$courseId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { courseId } = Route.useParams()

  return <EditCourse courseId={courseId} />
}