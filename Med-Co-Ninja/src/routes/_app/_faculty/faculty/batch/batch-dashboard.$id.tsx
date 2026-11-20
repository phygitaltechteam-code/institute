import BatchDashBoard from '@/components/faculty/batch/BatchDashBoard'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/_faculty/faculty/batch/batch-dashboard/$id')(
  {
    component: RouteComponent,
  },
)

function RouteComponent() {
  return <BatchDashBoard/>
}
