import PlacementForm from '@/components/faculty/placement/PlacementForm'
import Placement from '@/components/student/placement/Placment'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_app/_faculty/faculty/placement/edit-placement/$placementId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { placementId } = Route.useParams()
  return (
    <PlacementForm placementId={placementId} />
  )
}
