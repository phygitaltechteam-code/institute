import StudentDetailsTableReferal from '@/components/faculty/Referal/StudentDetailsTableAndReferal'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/_admin/admin/referal/referal-list/$id')({
  component: RouteComponent,
})

function RouteComponent() {
   const {id} = Route.useParams();
  
  return < StudentDetailsTableReferal batchId={id}/>
}
