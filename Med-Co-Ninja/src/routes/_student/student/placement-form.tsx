import PlacmentFrom from '@/components/student/placement/PlacmentFrom'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_student/student/placement-form')({
  component: RouteComponent,
})

function RouteComponent() {
  return <PlacmentFrom />
}
