import AddSubject from '@/components/faculty/AddSubject'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/_admin/admin/add-subject')({
  component: RouteComponent,
})

function RouteComponent() {
  return <AddSubject/>
}
