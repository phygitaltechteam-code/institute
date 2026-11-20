import { AddFaculty } from '@/components/admin/AddFaculty'
import { createFileRoute, useParams } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/_admin/admin/edit-faculty/$id')({

  component: RouteComponent,
})

function RouteComponent() {
    const { id } = Route.useParams()

  return  <AddFaculty facultyId={id}/>
}
