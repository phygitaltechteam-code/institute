import FormForAssignInterview from '@/components/faculty/interview/FormForAssignInterview'
import StudentTableForInterview from '@/components/faculty/interview/StudentTableForInterview'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_app/_faculty/faculty/interview/assigninterview/$id',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const {id} = Route.useParams();
  return <StudentTableForInterview batchId={id}/>
}
