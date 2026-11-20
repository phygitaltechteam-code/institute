import { AddFaculty } from '@/components/admin/AddFaculty'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/_admin/admin/add-faculty')({
  component: RouteComponent,
})

function RouteComponent() {
  return <AddFaculty/>
}
