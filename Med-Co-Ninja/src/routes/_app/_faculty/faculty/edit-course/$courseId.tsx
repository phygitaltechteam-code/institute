import EditCourse from '@/components/faculty/EditCourse'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_app/_faculty/faculty/edit-course/$courseId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { courseId } = Route.useParams()

  return <EditCourse courseId={courseId} />
}