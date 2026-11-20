import PlacementForm from '@/components/faculty/placement/PlacementForm'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_app/_admin/admin/placement/placementform',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <PlacementForm/>
}
